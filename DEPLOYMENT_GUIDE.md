# Deployment Guide — Production RAG System

## Architecture Overview

```
User Browser
     |
     v
Vercel (Frontend - React)
     |
     | /api/* requests proxied to:
     v
Render.com (Backend - FastAPI)
     |
     |--- Qdrant Cloud (Vector DB)
     |--- Groq API (LLM - llama3)
     |--- Langfuse Cloud (Monitoring)
```

---

## Step 1: Deploy Backend to Render.com

### 1a. Prepare the Backend

Push the code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rag-system.git
git push -u origin main
```

### 1b. Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Settings:
   - **Name:** `rag-backend`
   - **Environment:** `Docker`
   - **Branch:** `main`
   - **Dockerfile Path:** `backend/backend_dockerfile`
   - **Health Check Path:** `/api/health`

5. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `QDRANT_HOST` | `your-cluster.cloud.qdrant.io` |
| `QDRANT_PORT` | `6333` |
| `QDRANT_API_KEY` | *(from Qdrant Cloud)* |
| `LLM_PROVIDER` | `groq` |
| `GROQ_API_KEY` | *(from Groq)* |
| `LLM_MODEL` | `llama3-8b-8192` |
| `EMBEDDING_MODEL` | `BAAI/bge-base-en-v1.5` |
| `EMBEDDING_DEVICE` | `cpu` |
| `SECRET_KEY` | *(generate random)* |

6. Click **Create Web Service**

### 1c. Get Render URL

After deployment, you will get:
```
https://rag-backend.onrender.com
```

---

## Step 2: Set Up Qdrant Cloud

1. Go to https://cloud.qdrant.io
2. Sign up (free tier: 1GB storage)
3. Create a new cluster
4. Copy the **Cluster URL** and **API Key**
5. Add these to Render environment variables

---

## Step 3: Set Up Groq API (Free LLM)

1. Go to https://console.groq.com
2. Sign up (free tier: 30 req/min, 14,400 req/day)
3. Generate an API key
4. Add `GROQ_API_KEY` to Render env vars

---

## Step 4: Deploy Frontend to Vercel

### 4a. Via Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel --prod
```

### 4b. Via Vercel Dashboard

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add Environment Variable:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://rag-backend.onrender.com` |

6. Click **Deploy**

### 4c. Update Vercel Rewrites

In your Vercel dashboard → Project Settings → `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://rag-backend.onrender.com/api/$1"
    }
  ]
}
```

Your frontend will be at:
```
https://rag-system.vercel.app
```

---

## Step 5: Set Up Langfuse Monitoring

1. Go to https://cloud.langfuse.com
2. Sign up (free tier included)
3. Create a new project
4. Copy **Public Key** and **Secret Key**
5. Add to Render env vars:
   - `LANGFUSE_HOST=https://cloud.langfuse.com`
   - `LANGFUSE_PUBLIC_KEY=pk-...`
   - `LANGFUSE_SECRET_KEY=sk-...`

---

## Step 6: Verify Deployment

1. Go to `https://rag-backend.onrender.com/api/health`
   - Expected: `{"status": "healthy"}`
2. Go to `https://rag-system.vercel.app`
   - Login page should appear
3. Test the flow:
   - Register a user
   - Upload a document (PDF/MD/TXT)
   - Ask a question

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render | Free | Free (sleeps after inactivity) |
| Qdrant Cloud | Free | Free (1GB) |
| Groq API | Free | Free (30 req/min) |
| Langfuse Cloud | Free | Free |
| **Total** | | **$0/month** |

---

## Local vs Cloud Comparison

| Component | Local (Development) | Cloud (Production) |
|-----------|-------------------|-------------------|
| LLM | Ollama + Qwen3 | Groq API + Llama 3 |
| Vector DB | Qdrant (Docker) | Qdrant Cloud |
| Embeddings | BGE (local) | BGE (on backend server) |
| Re-ranker | BGE (local) | BGE (on backend server) |
| Monitoring | Langfuse (Docker) | Langfuse Cloud |
