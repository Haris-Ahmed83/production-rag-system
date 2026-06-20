# Deployment Guide — Production RAG System

## Architecture

```
User Browser
     |
     v
Vercel (Frontend - React)
     |
     | /api/* requests proxied to:
     v
Hugging Face Spaces (Backend - FastAPI)
     |
     |--- Qdrant Cloud (Vector DB - persistent)
     |--- Groq API (LLM - llama-3.1-8b-instant, 2 keys for failover)
     |--- BGE Embeddings (local, ONNX via fastembed)
```

## URLs

| Component | URL |
|-----------|-----|
| Frontend | `https://frontend-olive-one-a95hrma84g.vercel.app` |
| Backend API | `https://haris-83-rag-backend.hf.space` |
| Qdrant Cloud | `https://cccfed4d-b54a-45f3-8f66-b37829b804fa.us-east-2-0.aws.cloud.qdrant.io` |
| GitHub | `https://github.com/Haris-Ahmed83/production-rag-system` |

## Backend (HF Space)

### Deployment
- Auto-deploys from GitHub `main` branch
- Git push triggers rebuild
- Secrets set via HF Space dashboard

### Secrets (HF Space Settings)

| Secret | Value |
|--------|-------|
| `QDRANT_HOST` | `https://cccfed4d-b54a-45f3-8f66-b37829b804fa.us-east-2-0.aws.cloud.qdrant.io` |
| `QDRANT_API_KEY` | Qdrant Cloud API key |
| `GROQ_API_KEY` | Primary Groq key |
| `GROQ_FALLBACK_API_KEY` | Fallback key for rate-limit failover |

### Config (backend/.env)
- `CHUNK_SIZE=350`, `CHUNK_OVERLAP=50`
- `RETRIEVAL_TOP_K=30`, `FINAL_TOP_K=6`
- `LLM_MAX_TOKENS=1024`, `LLM_TEMPERATURE=0.1`
- `LLM_PROVIDER=groq`, `GROQ_MODEL=llama-3.1-8b-instant`
- `EMBEDDING_MODEL=BAAI/bge-base-en-v1.5`

## Frontend (Vercel)

### Rewrites (vercel.json)
Requests to `/api/*` are proxied to the HF Space backend:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://haris-83-rag-backend.hf.space/api/$1" }
  ]
}
```

## Qdrant Cloud

- Free tier: 1GB storage
- In-memory mode for local dev (`QDRANT_HOST=:memory:`)
- Cloud mode when `QDRANT_API_KEY` is set
- Data persists across HF Space restarts

## Key Upgrades

| # | Upgrade | Status |
|---|---------|--------|
| 1 | Qdrant Cloud (persistent DB) | Done |
| 2 | Cross-encoder reranker (graceful fallback) | Done |
| 3 | Custom domain | Skipped (no domain) |

## Running Locally

```bash
cd backend
pip install -r requirements.txt
echo "QDRANT_HOST=:memory:" > .env
uvicorn backend.app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

## Testing

Stress test script at `C:\Users\haris\AppData\Local\Temp\complex_test.py`
- 13 files, 22 queries
- Expected accuracy: 95%+

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| HF Spaces | Free (cpu-basic) | Free |
| Qdrant Cloud | Free (1GB) | Free |
| Groq API | Free (2 keys, 12000 TPM) | Free |
| **Total** | | **$0/month** |
