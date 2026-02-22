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

### 7. DevOps
- `start.sh` - Start all services (Docker + Backend + Frontend)
- `stop.sh` - Stop all services
- OpenRouter API key configured in `.env`

---

## Current Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React 18, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Docker) |
| Task Queue | Redis (Docker) |
| Auth | Clerk |
| AI/LLM | OpenRouter (Qwen 2.5) |
| PDF Gen | WeasyPrint |

---

## Where We're Heading (Next Steps)

### Phase 1: Polish & Fixes
- [ ] Fix any remaining UI bugs
- [ ] Add loading states to all async operations
- [ ] Error handling improvements

### Phase 2: Enhanced Features
- [ ] **Job URL Scraping** - Automatically extract job description from URL
- [ ] **Multiple Resume Templates** - Different ATS-friendly layouts
- [ ] **Application Tracking** - Dashboard to track applied jobs
- [ ] **Auto-Apply** - Browser automation for one-click applications

### Phase 3: Production
- [ ] Move from local Docker to cloud (Supabase + Railway/Render)
- [ ] Add Stripe payments
- [ ] Production domain & SSL
- [ ] Email notifications

### Phase 4: Advanced AI
- [ ] Better ATS algorithm with sentiment analysis
- [ ] Resume comparison tool
- [ ] Interview preparation based on job
- [ ] Salary negotiation insights

---

## How to Run

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

**Urls:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

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
├── start.sh               # Start script
└── stop.sh               # Stop script
```

---

## Recent Commits

- `f5913ca` - revert: undo performance changes - keeping Framer Motion animations
- `62f3c7c` - perf(ui): replace Framer Motion with CSS-only animations for mobile
- `4293822` - fix(ui): modernize hamburger menu with animated icon
- `0904a8e` - feat(ui): add mobile responsiveness

---

## Known Issues

- Backend LSP errors (type hints) -不影响功能
- Viewport metadata warnings in Next.js 15

---

## API Keys Needed

| Key | Status | Where to Get |
|-----|--------|--------------|
| OPENROUTER_API_KEY | ✅ Configured | openrouter.ai |
| CLERK_SECRET_KEY | Optional | Clerk dashboard |
| DATABASE_URL | ✅ Local Docker | - |

---

*Last Updated: Feb 23, 2026*
