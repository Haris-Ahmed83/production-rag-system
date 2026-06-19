"""
FastAPI application entry point for the Production RAG System.
Configures middleware, registers routes, and starts the server.
"""

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.configuration.app_config import config
from backend.app.api.middleware.request_logging import RequestLoggingMiddleware
from backend.app.api.routes import (
    user_authentication,
    ingest_documents,
    answer_questions,
    evaluate_system,
)

logger = structlog.get_logger()

app = FastAPI(
    title=config.app_name,
    version=config.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)

app.include_router(user_authentication.router)
app.include_router(ingest_documents.router)
app.include_router(answer_questions.router)
app.include_router(evaluate_system.router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": config.app_name,
        "version": config.app_version,
    }


@app.get("/api/stats")
def system_stats():
    """Returns system usage statistics."""
    return {
        "total_documents": 0,
        "total_chunks": 0,
        "queries_today": 0,
        "average_latency_ms": 0,
        "uptime_hours": 0,
    }


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Production RAG System", version=config.app_version)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Production RAG System")
