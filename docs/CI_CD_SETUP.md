# CI/CD Setup Guide

## Overview

This project uses GitHub Actions for CI/CD with the following workflow:

| Event | Action |
|-------|--------|
| Push to `feature/*`, `fix/*` | Deploy preview to Vercel |
| Push/PR to `main` | Deploy production to Vercel |
| Merge to `main` | Deploy backend to Railway |

---

## Required Secrets

Configure these secrets in **GitHub → Settings → Secrets and variables → Actions**:

### Vercel (Frontend)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization ID | Run: `vercel org ls` |
| `VERCEL_PROJECT_ID` | Project ID | Run: `vercel project ls` |
| `PREVIEW_API_URL` | Backend URL for preview | Railway preview domain |
| `PRODUCTION_API_URL` | Backend URL for production | Railway production domain |

### Railway (Backend)

| Secret | Description | How to Get |
|--------|-------------|------------|
| `RAILWAY_TOKEN` | Railway API token | [Railway Tokens](https://railway.app/account/tokens) |
| `RAILWAY_PROJECT_ID` | Railway project ID | Railway project settings |
| `DATABASE_URL` | PostgreSQL connection | Railway PostgreSQL service |
| `OPENROUTER_API_KEY` | AI API key | [OpenRouter](https://openrouter.ai/keys) |
| `FRONTEND_URL` | Frontend production URL | Vercel project domain |

---

## Setup Steps

### 1. Vercel Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd frontend
vercel link

# Get Org ID
vercel org ls

# Get Project ID  
vercel project ls
```

### 2. Railway Setup

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Link project
railway link
```

### 3. Add Secrets to GitHub

Go to: **https://github.com/hasnainzxc/autoapply.ai/settings/secrets/actions**

Add each secret from the tables above.

---

## Workflow Details

### CI/CD Pipeline (ci-cd.yml)

1. **Lint & Type Check** - Runs ESLint and TypeScript check on frontend
2. **Backend Lint** - Python syntax check
3. **Build** - Builds both frontend and backend
4. **Preview Deploy** - Deploys feature branches to Vercel preview
5. **Production Deploy** - Deploys main branch to Vercel production

### Backend Deploy (deploy-backend.yml)

1. Deploys backend to Railway when main is updated
2. Sets environment variables automatically

---

## Testing Locally

### Simulate Preview Build

```bash
cd frontend
npm run build
```

### Test with act (local GitHub Actions)

```bash
# Install act
brew install act

# Run workflow locally
act -l  # List workflows
act     # Run default workflow
```

---

## Troubleshooting

### Vercel Preview Not Working

- Ensure `VERCEL_TOKEN` has correct permissions
- Check Vercel project is linked properly

### Railway Deployment Fails

- Verify `RAILWAY_TOKEN` is valid
- Check `DATABASE_URL` is correct format: `postgresql://...`

### Secrets Not Available

- Ensure secrets are added to **Repository** level, not organization
- Secrets are uppercase in workflow files

---

## Current Production URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://autoapply-ai-git-main-hasnainzxcs-projects.vercel.app |
| Backend (Railway) | https://autoapplyai-production.up.railway.app |

---

*Last Updated: Feb 27, 2026*
