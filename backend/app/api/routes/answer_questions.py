"""
Query routes for asking questions and getting citation-backed answers.
Supports both regular and streaming responses.
"""

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

    if request.stream:
        return StreamingResponse(
            _stream_answer(request.question, workflow),
            media_type="text/event-stream",
        )

    try:
        result = workflow.run(request.question)
    except Exception as exc:
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


@router.post("/debug-search")
def debug_search(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
    workflow: RAGWorkflow = Depends(get_rag_workflow),
):
    """Debug endpoint: returns raw search results without LLM generation."""
    from backend.app.rag_pipeline.information_retrieval.hybrid_search import HybridSearch
    results = workflow.hybrid_search.search(query=request.question, top_k=30)
    chunks_info = []
    for r in results:
        chunks_info.append({
            "chunk_id": r.get("chunk_id"),
            "source": r.get("metadata", {}).get("file_name", r.get("metadata", {}).get("source", "?")),
            "score": r.get("rrf_score", r.get("dense_score", 0)),
            "text_preview": r.get("text", "")[:100],
        })
    return {"total_chunks": len(chunks_info), "chunks": chunks_info}


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
