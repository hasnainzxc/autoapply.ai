# ApplyMate - Project Documentation

## Overview
AI-powered job application automation platform that streamlines your job search with intelligent resume tailoring, cover letter generation, and automated applications.

---

## What We've Built (Completed)

### 1. Interactive Homepage with Flow
- **Get Started** button in hero section with best UX practices
- **See How It Works** button that scrolls to features section
- Modal-based flow for resume upload and job analysis

### 2. Resume Management System (`/resumes`)
- **Drag & Drop Upload** - PDF/DOCX support
- **Delete Functionality** - Each resume has delete button (shows on hover)
- **Last Used Resume Tracking** - Visual indicator at top with:
  - Animated green pulsing dot
  - Curved SVG wire connecting elements
  - Gradient border with glow effect
  - Progress bar animation
- **Smart Filename Extraction** - Converts `hasnain-resume-2024.pdf` → "Hasnain Resume 2024"
- **Fully Responsive** - Mobile-first design

### 3. Job Analysis Flow (Get Started Modal)
- **Terminal-style Job Input** - Paste job URL or description
- **Real-time Status Updates** - Animated messages during analysis
- **ATS Scoring** - Keyword match, format, achievement, impact scores
- **Matched/Missing Keywords** - Visual breakdown
- **Optimization Suggestions** - Actionable tips

### 4. Resume Optimization (LLM)
- **Enhanced Prompt Engineering** - Comprehensive prompts that:
  - Extract job keywords
  - Analyze ATS scoring criteria
  - Transform achievements with quantified metrics
  - Use power verbs (Led, Built, Created, Implemented, Optimized...)
- **Better PDF Output** - ATS score header, keyword insights, optimization tips

### 5. Cover Letter Generation
- **AI-powered** - Based on resume and job description
- **PDF Download** - Clean formatting
- **Copy to Clipboard** - Easy sharing

### 6. Backend APIs
- `POST /api/resume/upload` - Upload resume
- `POST /api/resume/tailor` - Optimize resume for job
- `POST /api/resume/cover-letter` - Generate cover letter
- `GET /api/resume/{id}/download` - Download PDF
- `DELETE /api/resumes/{id}` - Delete resume
- `GET /api/resumes` - List all resumes
- `GET /api/health` - Health check

### 7. Deployment Infrastructure
- **Vercel** frontend deployment configured
- **Railway** backend deployment configured
- **Docker** setup for local development
- **Scripts** - start.sh and stop.sh for easy local development

---

## Today's Work (Feb 23, 2026) - Deployment Journey

### Problems Solved:
1. ✅ **Initial deployment issues** - Fixed Railway config (rootDirectory, startCommand)
2. ✅ **Python syntax error** - Fixed f-string backslash issue in cover letter generation
3. ✅ **Database connection** - Fixed postgres:// to postgresql:// conversion
4. ✅ **Railway variable reference** - Added proper error handling for DATABASE_URL
5. ✅ **CORS issues** - Added FRONTEND_URL to backend CORS settings
6. ✅ **Production deployment** - Successfully deployed to Vercel + Railway

### Key Commits:
```
e322613 docs: Add comprehensive deployment guide
7825f0e fix: Add proper error handling for missing DATABASE_URL
8da39a4 fix: Handle postgres:// to postgresql:// conversion for Railway
143af90 fix: Resolve Python f-string backslash syntax error
3b89eda feat: Add resume optimization flow with ATS scoring and cover letter generation
```

### Issues Fixed During Deployment:
- ModuleNotFoundError: No module named 'app' → Added Root Directory config
- SyntaxError: f-string backslash → Fixed string formatting
- OperationalError: localhost connection → Added DATABASE_URL
- ArgumentError: Could not parse URL → Added proper error handling

---

## Current Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 18, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy |
| Database | PostgreSQL (Railway) |
| Task Queue | Redis (Railway) |
| Auth | Clerk |
| AI/LLM | OpenRouter (Qwen 2.5) |
| PDF Gen | WeasyPrint |
| Deployment | Vercel (Frontend), Railway (Backend) |

---

## Where We're Heading (Next Steps)

### Phase 1: Polish & Fixes
- [ ] Test full flow end-to-end
- [ ] Add loading states to all async operations
- [ ] Error handling improvements
- [ ] **Add Sentry monitoring** - Backend + Frontend error tracking
- [ ] Add UptimeRobot for health checks

### Phase 2: Enhanced Features
- [ ] **Job URL Scraping** - Automatically extract job description from URL
- [ ] **Multiple Resume Templates** - Different ATS-friendly layouts
- [ ] **Application Tracking** - Dashboard to track applied jobs
- [ ] **Auto-Apply** - Browser automation for one-click applications

### Phase 3: Production
- [x] Deploy to Vercel ✅
- [x] Deploy to Railway ✅
- [ ] Custom domain
- [ ] Add Stripe payments
- [ ] Email notifications

### Phase 4: Advanced AI
- [ ] Better ATS algorithm with sentiment analysis
- [ ] Resume comparison tool
- [ ] Interview preparation based on job
- [ ] Salary negotiation insights

---

## Production URLs

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://autoapply-ai-git-main-hasnainzxcs-projects.vercel.app |
| **Backend (Railway)** | https://autoapplyai-production.up.railway.app |
| **Frontend (Local)** | http://localhost:3000 |
| **Backend (Local)** | http://localhost:8000 |

---

## How to Run

### Local Development
```bash
# Start everything
./start.sh

# Stop everything
./stop.sh

# Manual start
docker start applymate-db applymate-redis
cd backend && PYTHONPATH=/home/hairzee/prods/applymate/backend python -m uvicorn app.main:app --port 8000
cd frontend && npm run dev
```

### After Code Changes
```bash
git add .
git commit -m "Your changes"
git push origin main
```
Both Vercel and Railway will auto-deploy!

---

## File Structure

```
applymate/
├── frontend/                 # Next.js 15
│   ├── app/
│   │   ├── page.tsx        # Homepage with hero
│   │   ├── resumes/         # Resume management
│   │   └── dashboard/      # User dashboard
│   └── components/
│       ├── kinetic-hero.tsx
│       ├── resume-uploader.tsx
│       ├── job-terminal.tsx
│       ├── analysis-results.tsx
│       ├── cover-letter.tsx
│       └── applymate-flow.tsx
│
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── api/routes/    # API endpoints
│   │   └── services/      # Database, auth
│   └── uploads/           # Uploaded files
│
├── docs/                   # Documentation
│   ├── PROJECT_STATUS.md
│   └── DEPLOYMENT_GUIDE.md
├── start.sh               # Start script
└── stop.sh               # Stop script
```

---

## Environment Variables

### Frontend (Vercel)
| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_API_URL | https://autoapplyai-production.up.railway.app |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | pk_test_xxx |

### Backend (Railway)
| Variable | Value |
|----------|-------|
| DATABASE_URL | postgresql://postgres:xxx@metro.proxy.rlwy.net:41671/railway |
| OPENROUTER_API_KEY | sk-or-v1-xxx |
| FRONTEND_URL | https://autoapply-ai-git-main-hasnainzxcs-projects.vercel.app |

---

## Monitoring Logs

### Railway (Backend)
- Go to backend service → **Logs** tab
- Shows all requests, errors, startup logs

### Vercel (Frontend)
- Go to project → **Deployments** → Click deployment
- Shows frontend errors

---

## Known Issues

- Backend LSP type hints (non-blocking)
- Viewport metadata warnings in Next.js 15

---

## Recent Commits (Last 10)

```
e322613 docs: Add comprehensive deployment guide
7825f0e fix: Add proper error handling for missing DATABASE_URL
8da39a4 fix: Handle postgres:// to postgresql:// conversion for Railway
c5f00aa Merge branch 'main' (workflows)
143af90 fix: Resolve Python f-string backslash syntax error
3b89eda feat: Add resume optimization flow with ATS scoring and cover letter generation
f5913ca revert: undo performance changes - keeping Framer Motion animations
```

---

## API Keys Status

| Key | Status | Location |
|-----|--------|----------|
| OPENROUTER_API_KEY | ✅ Configured | Railway + .env |
| DATABASE_URL | ✅ Configured | Railway |
| FRONTEND_URL | ✅ Configured | Railway |
| CLERK_SECRET_KEY | Optional | Not configured |

---

*Last Updated: Feb 23, 2026*
