# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from app.response_handler import call_llm

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    language: str = "auto"
    session_id: Optional[str] = None  # Support session tracking

@app.post("/chat")
def chat(request: ChatRequest):
    # call_llm now returns {"reply": "...", "language": "te", "session_id": "..."}
    result = call_llm(request.message, request.language, request.session_id)
    return result
