"""
Query routes for asking questions and getting citation-backed answers.
Supports both regular and streaming responses, with Groq rate-limit retry.
"""

import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.app.api.dependency_injection import (
    get_current_user,
    get_rag_workflow,
)
from backend.app.rag_pipeline.workflow_orchestration.rag_workflow import RAGWorkflow

router = APIRouter(prefix="/api/query", tags=["Query"])


class ChatRequest(BaseModel):
    question: str
    stream: bool = False


class Source(BaseModel):
    source: str
    page: Optional[str] = None
    chunk_id: Optional[str] = None
    reference: str


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list
    source_count: int


# Token bucket rate limiter (6000 TPM Groq free tier)
import threading
_rate_limit = {"tokens": 6000, "last_refill": time.time(), "lock": threading.Lock()}

def _check_rate_limit(cost: int = 1500) -> bool:
    with _rate_limit["lock"]:
        now = time.time()
        elapsed = now - _rate_limit["last_refill"]
        _rate_limit["tokens"] = min(6000, _rate_limit["tokens"] + elapsed * 6000 / 60)
        _rate_limit["last_refill"] = now
        if _rate_limit["tokens"] >= cost:
            _rate_limit["tokens"] -= cost
            return True
        return False

def _wait_for_tokens(cost: int = 1500, max_wait: float = 30.0) -> bool:
    waited = 0.0
    while waited < max_wait:
        if _check_rate_limit(cost):
            return True
        time.sleep(1.0)
        waited += 1.0
    return False


@router.post("/chat")
def ask_question(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
    workflow: RAGWorkflow = Depends(get_rag_workflow),
):
    """
    Answers a question using the RAG pipeline.
    Returns answer with source citations.
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Wait for rate limit tokens
    if not _wait_for_tokens(cost=1500):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a moment before asking another question.",
        )

    if request.stream:
        return StreamingResponse(
            _stream_answer(request.question, workflow),
            media_type="text/event-stream",
        )

    # Retry up to 2 times on rate limit errors
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            result = workflow.run(request.question)
            break
        except Exception as exc:
            err_str = str(exc)
            if "rate_limit_exceeded" in err_str or "429" in err_str or "413" in err_str:
                if attempt < max_retries:
                    time.sleep(2.0 * (attempt + 1))
                    continue
                raise HTTPException(
                    status_code=429,
                    detail="Groq API rate limit reached. Please wait and try again.",
                )
            import traceback
            raise HTTPException(
                status_code=500,
                detail=f"Workflow error: {str(exc)}\n{traceback.format_exc()}",
            )

    return ChatResponse(
        question=result["query"],
        answer=result["answer"],
        sources=result["sources"],
        source_count=result["source_count"],
    )





async def _stream_answer(question: str, workflow: RAGWorkflow):
    """
    Streams the answer token by token using Server-Sent Events.
    """
    try:
        result = workflow.run(question)
        answer = result["answer"]

        for token in answer.split(" "):
            yield f"data: {token} \n\n"

        yield f"data: [SOURCES]{result['sources']}[/SOURCES]\n\n"
        yield "data: [DONE]\n\n"

    except Exception as exc:
        yield f"data: [ERROR]{str(exc)}\n\n"
