from pydantic import BaseModel
from typing import Optional, List

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    translate_mode: bool = False
    original_response: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
