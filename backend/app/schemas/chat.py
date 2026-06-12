from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatMessageBase(BaseModel):
    content: str


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageResponse(ChatMessageBase):
    id: UUID
    sender: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ChatSessionCreate(BaseModel):
    title: str
    document_id: Optional[UUID] = None


class ChatSessionResponse(BaseModel):
    id: UUID
    document_id: Optional[UUID]
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
