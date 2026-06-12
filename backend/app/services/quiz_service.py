"""Quiz generation, attempts, and scoring service."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.base import EvaluationResult
from app.ai.factory import get_ai_provider
from app.models.document import AnalysisStatus, Document
from app.models.quiz import Question, Quiz, QuizAttempt
from app.models.user import User
from app.rag.knowledge_base import knowledge_base
from app.schemas.quiz import (
    AttemptResultResponse,
    QuestionResult,
    QuizGenerateRequest,
    StartAttemptResponse,
    SubmitAttemptRequest,
)
from app.utils.errors import AuthorizationError, NotFoundError, ValidationError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class QuizService:
    """Handles generating quizzes via AI, starting/submitting attempts, and scoring."""

    async def generate_quiz(
        self, db: AsyncSession, user_id: uuid.UUID, request: QuizGenerateRequest
    ) -> Quiz:
        """
        Retrieve context from pgvector document chunks and use AI to generate questions.
        
        Returns:
            The generated Quiz ORM object with its questions.
        """
        # 1. Quota & Plan Type Resolution
        from app.models.security_and_metrics import UserQuota, AuditLog
        from app.utils.context import client_ip_ctx, user_agent_ctx
        import datetime

        quota_result = await db.execute(
            select(UserQuota).where(UserQuota.user_id == user_id)
        )
        quota = quota_result.scalar_one_or_none()
        if not quota:
            quota = UserQuota(user_id=user_id, plan_type="free")
            db.add(quota)
            await db.flush()

        # Check and reset daily counter if needed
        today_date = datetime.datetime.now(datetime.timezone.utc).date()
        if quota.last_reset_date != today_date:
            quota.uploads_used_today = 0
            quota.quizzes_generated_today = 0
            quota.ai_requests_today = 0
            quota.last_reset_date = today_date
            await db.flush()

        # Enforce quiz generation limit
        max_daily_quizzes = 200 if quota.plan_type == "premium" else 10
        if quota.quizzes_generated_today >= max_daily_quizzes:
            raise ValidationError(
                f"Daily quiz generation limit ({max_daily_quizzes}) reached for your {quota.plan_type} plan."
            )

        # 2. Fetch document and verify ownership
        result = await db.execute(
            select(Document).where(
                Document.id == request.document_id, Document.is_deleted == False
            )
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise NotFoundError(f"Document {request.document_id} not found.")
        if doc.user_id != user_id:
            raise AuthorizationError("You do not have access to this document.")
        
        if doc.analysis_status != AnalysisStatus.INDEXED:
            raise ValidationError(
                f"Document is not ready. Current status: {doc.analysis_status.value}. "
                "Please wait until indexing completes."
            )

        # 3. Retrieve context from Knowledge Base
        query_query = f"{request.exam_style} exam quiz questions on {doc.subject or 'general topics'}"
        context = await knowledge_base.retrieve_context(
            db, request.document_id, query_query, top_k=8
        )
        if not context:
            context = doc.extracted_text[:8000] if doc.extracted_text else ""

        if not context or len(context.strip()) < 50:
            raise ValidationError("Not enough text content in the document to generate a quiz.")

        # 4. Request questions from AI provider
        ai_provider = get_ai_provider()
        if request.exam_style == "university_theory":
            request.question_types = ["theory"]

        settings = {
            "count": request.question_count,
            "difficulty": request.difficulty,
            "exam_style": request.exam_style,
            "question_types": request.question_types,
            "subject": doc.subject or "General",
            "level": doc.detected_level or "sss",
        }
        
        logger.info(
            f"Generating {request.question_count} questions style={request.exam_style} "
            f"for user {user_id} using {ai_provider.name}"
        )
        
        ai_questions = await ai_provider.generate_quiz(context, settings)

        # 5. Save Quiz and Questions together
        quiz_title = request.title or f"{doc.title or 'Doc'} Quiz"
        quiz = Quiz(
            user_id=user_id,
            document_id=doc.id,
            title=quiz_title,
            quiz_mode="practice",
            exam_style=request.exam_style,
            subject=doc.subject,
            difficulty=request.difficulty,
            question_count=len(ai_questions),
            time_limit_minutes=request.time_limit_minutes,
            model_used=ai_provider.name,
        )
        
        questions = []
        for i, q in enumerate(ai_questions):
            question = Question(
                question_number=i + 1,
                question_text=q.question_text,
                question_type=q.question_type,
                options=q.options,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                topic_reference=q.topic_reference,
                difficulty=q.difficulty,
                marks=q.marks,
                section=q.section,
            )
            questions.append(question)
            
        quiz.questions = questions
        db.add(quiz)
        
        # Increment quotas
        quota.quizzes_generated_today += 1
        await db.flush()  # Set quiz.id

        # Write compliance Audit Log
        audit = AuditLog(
            user_id=user_id,
            action="quiz_generation",
            status="success",
            ip_address=client_ip_ctx.get(),
            user_agent=user_agent_ctx.get(),
            details={"quiz_id": str(quiz.id), "document_id": str(doc.id), "question_count": len(ai_questions)},
        )
        db.add(audit)
        await db.commit()
        logger.info(f"Quiz {quiz.id} generated with {len(questions)} questions.")
        return quiz

    async def get_quizzes(self, db: AsyncSession, user_id: uuid.UUID) -> list[Quiz]:
        """Get all quizzes created by this user."""
        result = await db.execute(
            select(Quiz)
            .where(Quiz.user_id == user_id)
            .order_by(Quiz.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_quiz(self, db: AsyncSession, quiz_id: uuid.UUID, user_id: uuid.UUID) -> Quiz:
        """Fetch quiz with questions loaded, verifying ownership."""
        result = await db.execute(
            select(Quiz)
            .options(selectinload(Quiz.questions))
            .where(Quiz.id == quiz_id)
        )
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise NotFoundError(f"Quiz {quiz_id} not found.")
        if quiz.user_id != user_id:
            raise AuthorizationError("You do not have access to this quiz.")
        return quiz

    async def start_attempt(
        self, db: AsyncSession, quiz_id: uuid.UUID, user_id: uuid.UUID
    ) -> StartAttemptResponse:
        """Create a new attempt session for a quiz."""
        # Verify quiz access
        quiz_res = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = quiz_res.scalar_one_or_none()
        if not quiz:
            raise NotFoundError(f"Quiz {quiz_id} not found.")
        if quiz.user_id != user_id:
            raise AuthorizationError("You do not have access to this quiz.")

        # Count previous attempts to compute attempt_number
        count_res = await db.execute(
            select(func.count(QuizAttempt.id)).where(
                QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user_id
            )
        )
        attempts_count = count_res.scalar_one()

        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
            attempt_number=attempts_count + 1,
        )
        db.add(attempt)
        await db.commit()

        return StartAttemptResponse(
            attempt_id=attempt.id,
            quiz_id=quiz_id,
            started_at=attempt.started_at,
            time_limit_minutes=quiz.time_limit_minutes,
        )

    async def submit_attempt(
        self, db: AsyncSession, attempt_id: uuid.UUID, user_id: uuid.UUID, request: SubmitAttemptRequest
    ) -> AttemptResultResponse:
        """
        Score a quiz attempt, grant XP and update streak, evaluate via AI, and save results.
        """
        # 1. Fetch attempt and verify ownership
        result = await db.execute(
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.quiz))
            .where(QuizAttempt.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise NotFoundError(f"Quiz attempt {attempt_id} not found.")
        if attempt.user_id != user_id:
            raise AuthorizationError("You do not have access to this attempt.")
        if attempt.completed_at:
            raise ValidationError("This attempt has already been submitted.")

        # 2. Fetch quiz questions
        quiz = attempt.quiz
        questions_res = await db.execute(
            select(Question)
            .where(Question.quiz_id == quiz.id)
            .order_by(Question.question_number)
        )
        questions = list(questions_res.scalars().all())

        # 3. Perform rule-based scoring and compile lists for AI evaluation
        per_question_results = []
        score = 0.0
        max_score = 0.0
        ai_evaluation_questions = []

        for q in questions:
            user_answer = request.answers.get(str(q.id))
            is_correct = False
            marks_earned = 0.0
            max_marks = float(q.marks or 1.0)
            max_score += max_marks

            # Normalize user & correct answers
            norm_user = (user_answer or "").strip()
            norm_correct = q.correct_answer.strip()

            if q.question_type in ("mcq", "true_false"):
                is_correct = norm_user.lower() == norm_correct.lower()
                if is_correct:
                    marks_earned = max_marks
            elif q.question_type == "fill_blank":
                is_correct = norm_user.lower() == norm_correct.lower()
                if is_correct:
                    marks_earned = max_marks
            elif q.question_type == "theory":
                # Award 0.5 marks partial credit by default for any attempt; AI feedback will refine explanation
                if norm_user:
                    marks_earned = max_marks * 0.5
                    is_correct = True # Counted as partial success
                else:
                    marks_earned = 0.0
                    is_correct = False
            else:
                # Catch-all
                is_correct = norm_user.lower() == norm_correct.lower()
                if is_correct:
                    marks_earned = max_marks

            score += marks_earned

            # Keep detailed result format
            per_question_results.append(
                QuestionResult(
                    question_id=q.id,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    user_answer=user_answer,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation,
                    is_correct=is_correct,
                    marks_earned=marks_earned,
                    max_marks=max_marks,
                )
            )

            # Structure for AI feedback call
            ai_evaluation_questions.append({
                "id": str(q.id),
                "text": q.question_text,
                "correct": q.correct_answer,
            })

        percentage = (score / max_score * 100.0) if max_score > 0 else 0.0

        # 4. Call AI to evaluate and generate comprehensive feedback
        ai_provider = get_ai_provider()
        try:
            ai_eval = await ai_provider.evaluate_answers(ai_evaluation_questions, request.answers)
        except Exception as eval_exc:
            logger.warning(f"AI evaluation failed, using rule-based scoring only: {eval_exc}")
            ai_eval = EvaluationResult(
                per_question={},
                overall_evaluation="Quiz completed. Your score has been calculated. Keep studying!",
            )

        # Merge AI feedback with rule-based scoring
        ai_feedback_data = {}
        for q_res in per_question_results:
            q_id_str = str(q_res.question_id)
            feedback_item = ai_eval.per_question.get(q_id_str, {})
            # If AI says it is incorrect and it was a theory question, we can adjust scoring
            # But for standard waec/mcq, rely on rule-based matching
            ai_correct = feedback_item.get("correct")
            ai_feedback_text = feedback_item.get("feedback", "No specific feedback.")
            
            # Update explanation or feedback
            q_res.explanation = (q_res.explanation or "") + f" [Feedback: {ai_feedback_text}]"
            ai_feedback_data[q_id_str] = {
                "correct": q_res.is_correct if q_res.question_type != "theory" else ai_correct,
                "feedback": ai_feedback_text,
            }

        # 5. Calculate XP Points
        # Formula: 10 base points + score percentage factor
        xp_earned = 10 + int(percentage * 0.3)

        # 6. Update user XP and Streak
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one()
        user.xp_points += xp_earned
        
        # Streak calculation
        today = datetime.now(timezone.utc).date()
        if user.last_active_date:
            delta = (today - user.last_active_date).days
            if delta == 1:
                user.streak_days += 1
            elif delta > 1:
                user.streak_days = 1
            # If delta == 0, streak remains unchanged
        else:
            user.streak_days = 1
        user.last_active_date = today

        # 7. Update attempt details
        attempt.completed_at = datetime.now(timezone.utc)
        attempt.time_taken_seconds = request.time_taken_seconds
        attempt.score = score
        attempt.max_score = max_score
        attempt.percentage = percentage
        attempt.answers = request.answers
        attempt.ai_feedback = ai_feedback_data
        attempt.overall_evaluation = ai_eval.overall_evaluation
        attempt.xp_earned = xp_earned

        await db.commit()

        return AttemptResultResponse(
            attempt_id=attempt.id,
            quiz_id=quiz.id,
            score=score,
            max_score=max_score,
            percentage=percentage,
            time_taken_seconds=request.time_taken_seconds,
            xp_earned=xp_earned,
            overall_evaluation=ai_eval.overall_evaluation,
            questions=per_question_results,
        )

    async def get_attempt(
        self, db: AsyncSession, attempt_id: uuid.UUID, user_id: uuid.UUID
    ) -> AttemptResultResponse:
        """Fetch details of a completed attempt, including question answers."""
        result = await db.execute(
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.quiz))
            .where(QuizAttempt.id == attempt_id)
        )
        attempt = result.scalar_one_or_none()
        if not attempt:
            raise NotFoundError(f"Quiz attempt {attempt_id} not found.")
        if attempt.user_id != user_id:
            raise AuthorizationError("You do not have access to this attempt.")
        if not attempt.completed_at:
            raise ValidationError("This attempt has not been submitted yet.")

        # Load questions
        questions_res = await db.execute(
            select(Question)
            .where(Question.quiz_id == attempt.quiz_id)
            .order_by(Question.question_number)
        )
        questions = list(questions_res.scalars().all())

        per_question_results = []
        for q in questions:
            user_ans = (attempt.answers or {}).get(str(q.id))
            feedback_item = (attempt.ai_feedback or {}).get(str(q.id), {})
            
            # Determine is_correct
            is_correct = feedback_item.get("correct", False) if q.question_type == "theory" else (user_ans or "").strip().lower() == q.correct_answer.strip().lower()
            
            # Deduce marks earned based on is_correct
            marks_earned = float(q.marks or 1.0) if is_correct else 0.0
            if q.question_type == "theory" and is_correct and not feedback_item.get("correct"):
                # Partial credit fallback
                marks_earned = float(q.marks or 1.0) * 0.5

            per_question_results.append(
                QuestionResult(
                    question_id=q.id,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    user_answer=user_ans,
                    correct_answer=q.correct_answer,
                    explanation=f"{q.explanation or ''} [Feedback: {feedback_item.get('feedback', '')}]".strip(),
                    is_correct=is_correct,
                    marks_earned=marks_earned,
                    max_marks=float(q.marks or 1.0),
                )
            )

        return AttemptResultResponse(
            attempt_id=attempt.id,
            quiz_id=attempt.quiz_id,
            score=float(attempt.score or 0.0),
            max_score=float(attempt.max_score or 0.0),
            percentage=float(attempt.percentage or 0.0),
            time_taken_seconds=attempt.time_taken_seconds,
            xp_earned=attempt.xp_earned,
            overall_evaluation=attempt.overall_evaluation,
            questions=per_question_results,
        )


# Module-level singleton
quiz_service = QuizService()
