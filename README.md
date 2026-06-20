# Production RAG System

End-to-end Retrieval-Augmented Generation system with LangChain/LangGraph, Qdrant, BGE embeddings, and Groq API.

**Frontend:** https://frontend-olive-one-a95hrma84g.vercel.app  
**Backend:** https://haris-83-rag-backend.hf.space  
**Cost:** $0/month (all free tiers)

## Pipeline

```
Upload TXT → Chunk (350 chars, 50 overlap) → Embed (BGE) → Store (Qdrant Cloud)
Query → Hybrid Search (Dense + BM25) → RRF Merge → Cross-encoder Rerank → LLM (Groq) → Answer + Citations
```

## Features

- Multi-file upload with cumulative BM25 index
- Hybrid search (dense BGE + sparse BM25) with RRF fusion
- Cross-encoder reranker with graceful OOM fallback
- Strict prompt templates (zero hallucinations)
- Groq rate-limit failover (2 API keys)
- JWT authentication
- Persistent Qdrant Cloud storage
- 95%+ accuracy across 13-document stress tests

## Quick Start

```bash
git clone https://github.com/Haris-Ahmed83/production-rag-system.git
cd production-rag-system/backend
pip install -r requirements.txt
echo "QDRANT_HOST=:memory:" > .env
uvicorn backend.app.main:app --reload --port 8000
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for full setup.
