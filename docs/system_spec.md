# ApplyMate - System Specification

## Current Implementation Status

### ✅ Implemented Features

#### Backend (FastAPI)
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/health` | GET | ✅ Working |
| `/api/jobs/analyze` | POST | ✅ Working |
| `/api/jobs/apply` | POST | ✅ Working |
| `/api/credits/balance` | GET | ✅ Working |
| `/api/credits/purchase` | POST | ✅ Working |
| `/api/applications` | GET | ✅ Working |
| `/api/applications/{id}` | GET | ✅ Working |
| `/api/applications/{id}` | DELETE | ✅ Working |
| `/api/users/me` | GET | ✅ Working |
| `/api/users/me` | PUT | ✅ Working |
| `/api/resume/upload` | POST | ✅ Working |
| `/api/resume/tailor` | POST | ✅ Working |
| `/api/resume/{id}/download` | GET | ✅ Working |
| `/api/resume/events/{id}` | GET | ✅ Working |
| `/api/resumes` | GET | ✅ Working |
| `/api/webhooks/clerk` | POST | ✅ Working |

#### Frontend (Next.js 15)
| Page | Route | Status |
|------|-------|--------|
| Home | `/` | ✅ Working |
| Dashboard | `/dashboard` | ✅ Working |
| My Resumes | `/resumes` | ✅ Working |
| Sign In | `/sign-in` | ✅ Working |
| Sign Up | `/sign-up` | ✅ Working |

#### Infrastructure
| Component | Status |
|-----------|--------|
| PostgreSQL (Docker) | ✅ Running |
| Redis (Docker) | ✅ Running |
| SQLAlchemy ORM | ✅ Working |
| Clerk Auth | ✅ With dev fallback |

---

## Database Schema

### Tables Created
```sql
profiles          -- User profiles
credits           -- Credit balance
credit_transactions
applications      -- Job applications
application_events
resumes           -- Uploaded resumes
tailored_resumes  -- AI-tailored versions
resume_events     -- Event logging
```

---

## API Flow

### Resume Tailoring Flow
```
1. POST /api/resume/upload (PDF/DOCX)
   → Returns resume_id
   
2. POST /api/resume/tailor
   → resume_id + job_description
   → Calls OpenRouter LLM
   → Generates PDF
   → Returns tailored_resume_id
   
3. GET /api/resume/{id}/download
   → Returns PDF file
```

### Job Analysis Flow
```
1. POST /api/jobs/analyze
   → Scrapes job URL
   → Calculates match score
   → Returns JSON with score
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `OPENROUTER_API_KEY` | For resume tailoring | LLM API key |
| `CLERK_SECRET_KEY` | No | Auth (dev fallback available) |
| `REDIS_URL` | No | Celery queue |

---

## Local Development

### Quick Start
```bash
# Start Docker containers
docker start applymate-redis applymate-db

# Run backend
cd backend
PYTHONPATH=/home/hairzee/prods/applymate/backend python -m uvicorn app.main:app --port 8000

# Run frontend
cd frontend
npm run dev
```

### Testing
```bash
# Upload resume
curl -X POST http://localhost:8000/api/resume/upload -F "file=@resume.pdf"

# Tailor resume
curl -X POST http://localhost:8000/api/resume/tailor \
  -F "resume_id=<id>" \
  -F "job_description=<description>"

# Analyze job
curl -X POST http://localhost:8000/api/jobs/analyze \
  -H "Content-Type: application/json" \
  -d '{"job_url": "https://...", "job_title": "Engineer"}'
```

---

## UI/UX Redesign (Feb 2026)

### Overview
Complete frontend redesign to eliminate "AI slop" aesthetic and achieve professional SaaS look.

### Design System Changes

#### Typography
- Added **Space Grotesk** for display/headings
- Added **Outfit** for body text

#### Color Palette
```css
--primary: 262 83% 58% (violet)
--background: 0 0% 2% (near black)
--card: 0 0% 4%
```

#### New Effects
- Mesh gradient backgrounds
- Glass morphism (20px blur)
- Glow shadows on hover
- Animated gradient text

### Components Redesigned
| Component | File | Status |
|-----------|------|--------|
| Homepage | `app/page.tsx` | ✅ Complete |
| Navbar | `components/navbar.tsx` | ✅ Complete |
| Bento Grid | `components/dashboard/bento-grid.tsx` | ✅ Complete |
| Recent Applications | `components/dashboard/recent-applications.tsx` | ✅ Complete |

### New Homepage Sections
- Hero with animated mesh gradient + grid pattern
- Stats section (50K+ applications, 92% interview rate, etc.)
- Features grid (4 columns with gradient icons)
- How it works (3-step numbered cards)
- Testimonials with ratings
- CTA section with gradient card

### Documentation
- Created `docs/ui-refactoring.md` with detailed changes

---

## Next Steps (Phase 3)
- [ ] Auto-apply workflow
- [ ] Cover letter generation
- [ ] Real browser automation
- [ ] Stripe payments
- [ ] Production deployment
