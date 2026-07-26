import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.router import ModelRouter
from app.models.chat import ChatMessage, ChatSession
from app.models.document import DocumentChunk
from app.models.security_and_metrics import UserQuota
from app.schemas.chat import ChatMessageResponse, ChatSessionResponse
from app.utils.errors import NotFoundError, ValidationError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ChatService:
    def __init__(self):
        self.router = ModelRouter()

    async def get_user_tier(self, db: AsyncSession, user_id: uuid.UUID) -> str:
        """Fetch the user's subscription plan type."""
        result = await db.execute(select(UserQuota).filter(UserQuota.user_id == user_id))
        quota = result.scalar_one_or_none()
        return quota.plan_type if quota else "free"

    async def create_session(
        self, db: AsyncSession, user_id: uuid.UUID, title: str, document_id: Optional[uuid.UUID] = None
    ) -> ChatSessionResponse:
        session = ChatSession(user_id=user_id, document_id=document_id, title=title)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return ChatSessionResponse(
            id=session.id,
            document_id=session.document_id,
            title=session.title,
            created_at=session.created_at,
            messages=[]
        )

    async def get_sessions(self, db: AsyncSession, user_id: uuid.UUID) -> List[ChatSessionResponse]:
        result = await db.execute(
            select(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc())
        )
        sessions = result.scalars().all()
        return [
            ChatSessionResponse(
                id=s.id, document_id=s.document_id, title=s.title, created_at=s.created_at, messages=[]
            )
            for s in sessions
        ]

    async def get_messages(
        self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
    ) -> List[ChatMessageResponse]:
        # Validate ownership
        result = await db.execute(
            select(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise NotFoundError("Chat session not found")

        msg_result = await db.execute(
            select(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
        )
        messages = msg_result.scalars().all()
        return [
            ChatMessageResponse(id=m.id, sender=m.sender, content=m.content, created_at=m.created_at)
            for m in messages
        ]

    async def send_message(
        self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID, content: str
    ) -> ChatMessageResponse:
        # 1. Fetch Session
        result = await db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise NotFoundError("Chat session not found")

        # 2. Save User Message
        user_msg = ChatMessage(session_id=session_id, sender="user", content=content)
        db.add(user_msg)
        await db.flush()

        # 3. Determine Tier and History limits
        tier = await self.get_user_tier(db, user_id)
        history_limit = 10 if tier == "free" else 1000  # "Premium" effectively unlimited

        # Build message history for AI
        sorted_messages = sorted(session.messages + [user_msg], key=lambda m: m.created_at)
        recent_messages = sorted_messages[-history_limit:]

        ai_messages = [
            {"role": "user" if m.sender == "user" else "ai", "content": m.content}
            for m in recent_messages
        ]

        # 4. RAG Context Retrieval
        rag_context = ""
        if session.document_id:
            # Fetch all chunks (for a real system with large docs, we would use vector search.
            # But for standard notes, we can just supply the text or top chunks)
            # We'll use pgvector to search chunks related to the user's latest content
            embedder_result = await self.router.embed([content])
            query_vector = embedder_result[0]

            # Vector similarity search over DocumentChunks for the document
            chunk_result = await db.execute(
                select(DocumentChunk)
                .filter(DocumentChunk.document_id == session.document_id)
                .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
                .limit(5)  # Get top 5 relevant chunks
            )
            chunks = chunk_result.scalars().all()
            if chunks:
                rag_context = "\n\n".join([f"--- Excerpt {i+1} ---\n{c.content}" for i, c in enumerate(chunks)])

        # 5. Save Prompt reference to the session
        from app.services.prompt_service import prompt_service
        if not session.prompt_id:
            try:
                _, p_id, p_ver, p_var = await prompt_service.get_formatted_prompt(
                    db, category="tutor_chat"
                )
                session.prompt_id = p_id
                session.prompt_version = p_ver
                session.prompt_variant = p_var
            except ValueError:
                pass

        # 6. Generate AI Response
        from app.utils.errors import AIProviderError
        try:
            ai_response_text = await self.router.chat(messages=ai_messages, context=rag_context)
        except AIProviderError as e:
            logger.error(f"AI Provider error during chat: {e}")
            ai_response_text = f"⚠️ I'm sorry, but I encountered an error connecting to the AI provider. Please check your API credits or configuration. \n\n**Error Details:** {str(e)}"

        # 7. Deduct from UserQuota
        from sqlalchemy import update
        from app.models.security_and_metrics import UserQuota
        await db.execute(
            update(UserQuota)
            .where(UserQuota.user_id == user_id)
            .values(ai_requests_today=UserQuota.ai_requests_today + 1)
        )

        # 8. Save AI Response
        ai_msg = ChatMessage(session_id=session_id, sender="ai", content=ai_response_text)
        db.add(ai_msg)
        await db.commit()
        await db.refresh(ai_msg)

        return ChatMessageResponse(
            id=ai_msg.id,
            sender=ai_msg.sender,
            content=ai_msg.content,
            created_at=ai_msg.created_at
        )

    async def stream_message(
        self, db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID, content: str
    ):
        """Async generator that streams chat responses."""
        # 1. Fetch Session
        result = await db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            yield "data: {\"error\": \"Chat session not found\"}\n\n"
            return

        # 2. Save User Message
        user_msg = ChatMessage(session_id=session_id, sender="user", content=content)
        db.add(user_msg)
        await db.commit()
        await db.refresh(session, ['messages'])
        
        # 3. Determine Tier and History limits
        tier = await self.get_user_tier(db, user_id)
        history_limit = 10 if tier == "free" else 1000

        # Build message history for AI
        sorted_messages = sorted(session.messages, key=lambda m: m.created_at)
        recent_messages = sorted_messages[-history_limit:]
        ai_messages = [{"role": "user" if m.sender == "user" else "ai", "content": m.content} for m in recent_messages]

        # 4. RAG Context Retrieval
        rag_context = ""
        if session.document_id:
            try:
                embedder_result = await self.router.embed([content])
                query_vector = embedder_result[0]
                chunk_result = await db.execute(
                    select(DocumentChunk)
                    .filter(DocumentChunk.document_id == session.document_id)
                    .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
                    .limit(5)
                )
                chunks = chunk_result.scalars().all()
                if chunks:
                    rag_context = "\n\n".join([f"--- Excerpt {i+1} ---\n{c.content}" for i, c in enumerate(chunks)])
            except Exception as e:
                logger.warning(f"RAG failed during chat stream: {e}")

        # 5. Save Prompt reference
        from app.services.prompt_service import prompt_service
        if not session.prompt_id:
            try:
                _, p_id, p_ver, p_var = await prompt_service.get_formatted_prompt(db, category="tutor_chat")
                session.prompt_id = p_id
                session.prompt_version = p_ver
                session.prompt_variant = p_var
                await db.commit()
            except ValueError:
                pass

        # 6. Stream and accumulate AI Response
        import json
        from app.utils.errors import AIProviderError
        accumulated_text = []
        try:
            stream = await self.router.chat_stream(messages=ai_messages, context=rag_context)
            async for chunk in stream:
                accumulated_text.append(chunk)
                # Yield SSE chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except AIProviderError as e:
            logger.error(f"AI stream error: {e}")
            error_msg = f"\n\n⚠️ Provider error: {str(e)}"
            accumulated_text.append(error_msg)
            yield f"data: {json.dumps({'chunk': error_msg})}\n\n"
        except Exception as e:
            logger.error(f"Unexpected stream error: {e}")
            yield f"data: {json.dumps({'chunk': '⚠️ Connection lost.'})}\n\n"

        ai_response_text = "".join(accumulated_text)

        # 7. Deduct from UserQuota & Save AI Message
        from sqlalchemy import update
        from app.models.security_and_metrics import UserQuota
        try:
            await db.execute(
                update(UserQuota)
                .where(UserQuota.user_id == user_id)
                .values(ai_requests_today=UserQuota.ai_requests_today + 1)
            )
            ai_msg = ChatMessage(session_id=session_id, sender="ai", content=ai_response_text)
            db.add(ai_msg)
            await db.commit()
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.error(f"Failed saving chat message: {e}")

chat_service = ChatService()
