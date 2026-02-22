# ApplyMate Deployment Guide

## Overview

This document outlines how to deploy ApplyMate - the frontend on Vercel and backend on Railway.

---

## Architecture

```
┌─────────────────────┐      ┌─────────────────────┐
│   Vercel           │      │   Railway           │
│   (Frontend)       │      │   (Backend)        │
│                    │      │                    │
│   Next.js 15       │─────▶│   FastAPI           │
│   React 18          │      │   PostgreSQL        │
│   Tailwind CSS      │      │   OpenRouter AI     │
│                    │      │                    │
│  autoapply.ai      │      │  autoapplyai.up.    │
│                    │      │   railway.app       │
└─────────────────────┘      └─────────────────────┘
```

---

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Railway account (for backend)
- OpenRouter API key (for AI)

---

## Quick Start

### Local Development

```bash
# Clone repo
git clone https://github.com/hasnainzxc/autoapply.ai.git
cd autoapply.ai

# Start local
./start.sh

# Stop local
./stop.sh

# Or manually:
docker start applymate-db applymate-redis
cd backend && python -m uvicorn app.main:app --port 8000
cd frontend && npm run dev
```

---

## Deployment Steps

### Step 1: Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. Import your GitHub repo (`hasnainzxc/autoapply.ai`)
3. Framework: **Next.js**
4. Build Command: `next build`
5. Output Directory: `.next`
6. Deploy

**Frontend URL:** `https://autoapply-ai-git-main-hasnainzxcs-projects.vercel.app`

---

### Step 2: Deploy Backend (Railway)

#### A. Create PostgreSQL Database

1. Go to Railway Dashboard
2. Click **New** → **PostgreSQL**
3. Name: `applymate-db`
4. Wait for it to start
5. Copy the **Connection String** (like `postgresql://postgres:password@hostname.railway.internal:5432/railway`)

#### B. Deploy Backend Service

1. Click **New** → **GitHub Repo**
2. Select: `hasnainzxc/autoapply.ai`
3. **Root Directory:** `backend`
4. **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### C. Add Environment Variables

In your backend service **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@metro.proxy.rlwy.net:41671/railway` |
| `OPENROUTER_API_KEY` | `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` |
| `FRONTEND_URL` | `https://autoapply-ai-git-main-hasnainzxcs-projects.vercel.app` |

#### D. Get Backend URL

1. Go to **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy URL (like `autoapplyai-production.up.railway.app`)

---

### Step 3: Connect Frontend to Backend

1. Go to Vercel → your project → **Settings** → **Environment Variables**
2. Add:
   ```
   Name:  NEXT_PUBLIC_API_URL
   Value: https://autoapplyai-production.up.railway.app
   ```
3. Redeploy frontend

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://autoapplyai.up.railway.app` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth key | `pk_test_xxx` |

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `OPENROUTER_API_KEY` | AI API key | `sk-or-v1-...` |
| `FRONTEND_URL` | Frontend URL | `https://...vercel.app` |

---

## Common Issues & Fixes

### 1. Backend won't start - "ModuleNotFoundError: No module named 'app'"

**Fix:** Set Root Directory to `backend` in Railway settings.

### 2. Database connection error

**Fix:** Make sure `DATABASE_URL` is set correctly with the full connection string from PostgreSQL service.

### 3. "postgres://" vs "postgresql://"

Railway uses `postgres://` but SQLAlchemy needs `postgresql://`. The code handles this automatically.

### 4. CORS errors

**Fix:** Set `FRONTEND_URL` in Railway backend variables to match your Vercel URL.

---

## Monitoring & Logs

### Railway Logs
- Go to backend service → **Logs** tab
- Shows all requests, errors, startup logs

### Vercel Logs
- Go to project → **Deployments** → Click on deployment
- Shows frontend errors

---

## Updating the App

### After Code Changes

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
```

Both Vercel and Railway will auto-deploy from main branch.

### Manual Redeploy

- **Vercel:** Go to Deployments → Click "Redeploy"
- **Railway:** Go to Deployments → Click "Redeploy"

---

## File Structure for Deployment

```
applymate/
├── backend/
│   ├── app/
│   │   ├── api/routes/    # API endpoints
│   │   ├── services/       # Database, auth
│   │   └── main.py         # FastAPI app
│   ├── uploads/            # Uploaded files
│   ├── requirements.txt    # Python deps
│   ├── Procfile            # For some platforms
│   └── railway.json        # Railway config
│
├── frontend/
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   └── package.json       # Node deps
│
└── start.sh               # Local start script
```

---

## Commands Reference

### Local Development
```bash
# Start everything
./start.sh

# Stop everything
./stop.sh

# Manual backend
cd backend
PYTHONPATH=/home/hairzee/prods/applymate/backend python -m uvicorn app.main:app --port 8000

# Manual frontend
cd frontend
npm run dev
```

### Docker (Local Infrastructure)
```bash
# Start PostgreSQL + Redis
docker start applymate-db applymate-redis

# Stop
docker stop applymate-db applymate-redis

# View logs
docker logs applymate-db
docker logs applymate-redis

# Connect to PostgreSQL
docker exec -it applymate-db psql -U postgres -d applymate
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume |
| POST | `/api/resume/tailor` | Optimize resume for job |
| POST | `/api/resume/cover-letter` | Generate cover letter |
| GET | `/api/resume/{id}/download` | Download PDF |
| GET | `/api/resumes` | List all resumes |
| DELETE | `/api/resumes/{id}` | Delete resume |
| GET | `/api/health` | Health check |

---

## Tech Stack

| Component | Technology |
|----------|------------|
| Frontend | Next.js 15, React 18, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy |
| Database | PostgreSQL (Railway) |
| Auth | Clerk |
| AI | OpenRouter (Qwen 2.5) |
| Deployment | Vercel (Frontend), Railway (Backend) |

---

## Useful Links

- **Frontend (Vercel):** https://autoapply-ai-git-main-hasnainzxcs-projects.vercel.app
- **Backend (Railway):** https://autoapplyai-production.up.railway.app
- **OpenRouter Dashboard:** https://openrouter.ai
- **Railway Dashboard:** https://railway.app
- **Vercel Dashboard:** https://vercel.com

---

*Last Updated: Feb 23, 2026*
