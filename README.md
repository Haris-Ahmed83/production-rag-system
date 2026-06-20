<div align="center">

# Production RAG System 🚀

**End-to-end Retrieval-Augmented Generation system — $0/month, production-grade.**

[![Live Demo](https://img.shields.io/badge/-Live%20Demo-00C7B7?style=for-the-badge&logo=vercel)](https://frontend-olive-one-a95hrma84g.vercel.app)
[![Backend API](https://img.shields.io/badge/-API%20Health-FF6B6B?style=for-the-badge&logo=huggingface)](https://haris-83-rag-backend.hf.space/api/health)
[![Docker](https://img.shields.io/badge/-Docker%20Image-2496ED?style=for-the-badge&logo=docker)](https://github.com/users/Haris-Ahmed83/packages/container/production-rag-system)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Overview

A full-stack RAG system that lets you upload documents and ask questions with **citation-backed answers**. Built with **LangGraph** for workflow orchestration, **Qdrant Cloud** for persistent vector storage, **Groq** for fast LLM inference, and **React** for the frontend.

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | React 18 + TypeScript + TailwindCSS + Vite | Free (Vercel) |
| Backend | Python + FastAPI + LangChain + LangGraph | Free (HF Spaces) |
| Vector DB | Qdrant Cloud (persistent, 1GB) | Free |
| Embeddings | BAAI/bge-base-en-v1.5 (ONNX) | Local |
| LLM | Groq llama-3.1-8b-instant (2-key failover) | Free (12k TPM) |
| Reranker | BAAI/bge-reranker-v2-m3 (graceful fallback) | Local |
| **Total** | | **$0/month** |

---

## 🏗️ Architecture

```
Upload TXT → Chunk (350 chars, 50 overlap)
                ↓
         BGE Embeddings (ONNX)
                ↓
      ┌─────────────────────┐
      │   Qdrant Cloud       │  ← Persistent across restarts
      │   + BM25 (cumulative)│
      └─────────────────────┘
                ↓
         Hybrid Search (Dense + BM25)
                ↓
            RRF Fusion
                ↓
         Cross-encoder Reranker ← Graceful fallback on OOM
                ↓
      ┌─────────────────────┐
      │  Groq LLM (2-key)    │  ← Auto retry on rate limit
      │  Strict prompts      │  ← Zero hallucinations
      └─────────────────────┘
                ↓
       Answer + [1] [2] [3] Citations
```

---

## ✨ Features

| Feature | Detail |
|---------|--------|
| **Multi-file upload** | Cumulative BM25 index across all files |
| **Hybrid search** | Dense (BGE cosine) + Sparse (BM25) with RRF fusion |
| **Cross-encoder reranker** | BGE reranker with automatic OOM fallback |
| **Zero hallucinations** | Strict prompt: "If not in context, say cannot find" |
| **Rate-limit failover** | 2 Groq API keys, automatic fallback + retry |
| **JWT auth** | OAuth2 with access + refresh tokens |
| **Persistent storage** | Qdrant Cloud survives all restarts |
| **Accuracy** | 95%+ on 13-doc / 22-query stress tests |
| **Cost** | $0/month — all free tiers |

---

## 🚀 Quick Start

### Local Development

```bash
# Backend
git clone https://github.com/Haris-Ahmed83/production-rag-system.git
cd production-rag-system/backend
pip install -r requirements.txt
echo "QDRANT_HOST=:memory:" > .env
uvicorn backend.app.main:app --reload --port 8000

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

### Docker

```bash
docker pull ghcr.io/haris-ahmed83/production-rag-system:latest
docker run -p 8000:8000 ghcr.io/haris-ahmed83/production-rag-system
```

---

## 🧪 Testing

```bash
python C:\Users\haris\AppData\Local\Temp\complex_test.py
```

Runs 22 queries across 13 complex documents. Expected: **95%+ accuracy**.

---

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) — Full setup for production
- [Project Board](https://github.com/users/Haris-Ahmed83/projects/2) — Track progress and tasks

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|------------|
| **Language** | Python 3.12, TypeScript |
| **Backend** | FastAPI, LangChain, LangGraph |
| **Frontend** | React 18, TailwindCSS, Vite |
| **Vector DB** | Qdrant Cloud (qdrant-client v1.18+) |
| **LLM** | Groq API (llama-3.1-8b-instant) |
| **Embeddings** | BAAI/bge-base-en-v1.5 (fastembed) |
| **Reranker** | BAAI/bge-reranker-v2-m3 (transformers) |
| **Auth** | JWT (python-jose + bcrypt) |
| **CI/CD** | GitHub Actions → GHCR |
| **Hosting** | Vercel (frontend) + HF Spaces (backend) |

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Chunk size | 350 chars (50 overlap) |
| Retrieval top-k | 30 |
| Final top-k | 6 |
| LLM max tokens | 1024 |
| Avg response time | ~6.0s |
| Accuracy (13 docs) | 95%+ |

---

<div align="center">

Built with ❤️ by [Harris Ahmed](https://github.com/Haris-Ahmed83)

</div>
