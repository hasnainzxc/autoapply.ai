# ApplyMate Architecture Audit Report

**Date:** February 2026  
**Status:** Development/Testing Phase (Not Production)  
** Auditor:** Senior Staff Engineer Review

---

## 📋 EXECUTIVE SUMMARY

This codebase is in **early development/testing phase**. Several security and architecture issues exist but are acceptable for internal testing. This document outlines all findings for tracking.

**Risk Tolerance:** Low — Internal dev only  
**Public Exposure:** None  

---

## 🚨 CRITICAL ISSUES (Fix Before Production)

| # | Issue | File | Line | Current | Fix Required |
|---|-------|------|------|---------|-------------|
| 1 | Hardcoded upload path | `resumes.py` | 15 | `/home/hairzee/prods/applymate/backend/uploads` | Environment variable |
| 2 | Hardcoded DB credentials | `database.py` | 9 | `postgres:postgres@localhost` | DATABASE_URL env var |
| 3 | Silent auth fallback | `auth.py` | 14,27,38 | Returns `test-user-123` | Remove or require valid auth |
| 4 | CORS restrictive | `main.py` | 18 | Only localhost:3000 | Add prod domains before launch |

---

## ⚠️ HIGH PRIORITY (Fix Before Public Release)

| # | Issue | File | Recommendation |
|---|-------|------|----------------|
| 1 | Duplicate match score logic | jobs.py, resume_crafter.py | Consolidate to single service |
| 2 | Credit logic scattered | jobs.py, credits.py, applications.py | Centralize in credits.py service |
| 3 | No input validation schemas | All routes | Add Pydantic models |
| 4 | No centralized error handler | main.py | Add exception handlers |
| 5 | LLM prompts embedded | resumes.py:203-232 | Move to prompt templates |

---

## 🔍 CONFLICTS & DUPLICATION

### Duplicate: Match Score Logic

```python
# Location 1: backend/app/api/routes/jobs.py:160-196
async def get_match_score(job_description: str, user_profile: dict) -> int:
    # ... LLM call to OpenRouter
    score = int(''.join(filter(str.isdigit, score_text))) or 50

# Location 2: backend/app/workers/resume_crafter.py:29-56
async def get_match_score():
    # ... identical LLM call
    score = int(''.join(filter(str.isdigit, score_text))) or 50

# Location 3: Same file, craft_resume_task also duplicates
```

**Action:** Create `app/services/scoring.py` with single function

---

### Duplicate: Credit Operations

| Operation | File | Lines |
|-----------|------|-------|
| Deduct 1 credit (analyze) | jobs.py | 27-32 |
| Deduct 1 credit (apply) | jobs.py | 100-107 |
| Add credits (purchase) | credits.py | 47-48 |
| Refund credits (cancel) | applications.py | 117-121 |

**Action:** Create `app/services/credits.py` with:
- `deduct_credit(db, user_id, amount, reason)`
- `add_credit(db, user_id, amount, reason)`
- `refund_credit(db, user_id, application_id)`

---

### Duplicate: Profile Creation

```python
# jobs.py:38-46 - Creates default profile if not exists
if not profile:
    profile = Profile(
        clerk_id=current_user,
        email=f"{current_user}@example.com",  # ← Magic email
        base_resume="..."
    )

# resume_crafter.py:18-23 - Gets profile
profile_response = supabase_client.get_table("profiles").select("*")...
```

**Action:** Create `app/services/profile.py` with `get_or_create_profile()`

---

## 🎨 JARGON / VIBE-CODE

### Hardcoded Dashboard Values

```typescript
// frontend/components/dashboard/bento-grid.tsx

// Lines 69-111 - ALL HARDCODED
<BentoCard title="Active Agents" value={3} ... />
<BentoCard title="Success Rate" value="78%" ... />
<BentoCard title="Applications" value={12} ... />
<BentoCard title="Match Score" value="85%" ... />
```

**Impact:** These should fetch from API  
**Status in Testing:** Acceptable (mock data)

---

### Magic Strings

| File | Line | Magic |
|------|------|-------|
| auth.py | 14 | `return {"sub": "test-user-123", ...}` |
| auth.py | 27,38 | `return "test-user-123"` |
| jobs.py | 42 | `email=f"{current_user}@example.com"` |
| jobs.py | 164 | `openrouter_key == "your_openrouter_key"` |
| bento-grid.tsx | 69,80,92,103 | Hardcoded stats |

---

### Hardcoded API URL (Frontend)

```typescript
// frontend/app/dashboard/page.tsx:25
const res = await fetch("http://localhost:8000/api/resumes");
// Should be: process.env.NEXT_PUBLIC_API_URL
```

**Status in Testing:** Acceptable (dev only)

---

## 🏗 ARCHITECTURAL SMELLS

### Backend

| Smell | Location | Impact | Severity |
|-------|----------|--------|----------|
| Business logic in routes | jobs.py:17-89 | Hard to test | HIGH |
| No service layer | All routes call DB directly | Duplication | HIGH |
| LLM prompts in route | resumes.py:203-232 | Hard to maintain | MEDIUM |
| Sync asyncio.run in worker | resume_crafter.py:60,130 | Blocks event loop | MEDIUM |
| No structured logging | workers/ | No debugging | MEDIUM |
| Retry without backoff | applicator.py:7 | Hammer API | MEDIUM |

### Frontend

| Smell | Location | Impact | Severity |
|-------|----------|--------|----------|
| Page contains business logic | page.tsx 689 lines | Hard to maintain | HIGH |
| No error boundary | All pages | Crash = white screen | HIGH |
| No loading states | Dashboard | UX poor | MEDIUM |
| Hardcoded API URL | dashboard/page.tsx:25 | Won't work in prod | HIGH |
| No Suspense wrappers | All pages | Hydration issues | MEDIUM |

---

## 🧪 TEST COVERAGE (Current: NONE)

### Critical Business Logic — NO TESTS

- [ ] Credit deduction (deducts real money)
- [ ] Match score calculation (core AI feature)
- [ ] Resume text extraction (PyPDF2, docx)
- [ ] LLM JSON parsing (can fail)
- [ ] Application status transitions
- [ ] Profile creation flow

### Recommended Test Structure

```
backend/tests/
├── conftest.py              # Fixtures
├── test_credits.py          # Credit operations
├── test_scoring.py          # Match score
├── test_resume_extraction.py # PDF/DOCX parsing
├── test_llm_parsing.py      # JSON validation
└── test_application_flow.py # Status transitions
```

---

## 📊 FILE SIZE ANALYSIS

### Oversized Files

| File | Lines | Target | Status |
|------|-------|--------|--------|
| frontend/app/page.tsx | 689 | 200 | Needs split |
| backend/app/api/routes/resumes.py | 447 | 300 | Okay |
| backend/app/workers/resume_crafter.py | 146 | 150 | Okay |
| frontend/app/dashboard/page.tsx | 97 | 100 | Okay |

---

## 🔐 SECURITY CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Secrets in .env | ✅ Safe | .env not committed |
| Auth on all routes | ⚠️ Partial | Falls back to test-user |
| Input validation | ❌ None | All inputs accepted |
| Rate limiting | ❌ None | Vulnerable to DoS |
| SQL injection | ✅ Safe | Using ORM |
| XSS | ✅ Safe | React escapes |
| CORS | ⚠️ Strict | Only localhost |

---

## 🧹 CLEANUP ITEMS

### Dead Code / Unused

- [ ] `frontend/test-dummy.txt` — from PR testing
- [ ] `src/` directory — appears unused (old scraper code?)
- [ ] `config/config.yaml` — appears unused

### Commented-Out Blocks

- [ ] `applicator.py:28-44` — Playwright code commented

---

## 📝 RECOMMENDED PR SEQUENCE

### PR #1 — Security & Config (Before Production)
- [ ] Environment variable for UPLOAD_DIR
- [ ] Environment variable for DATABASE_URL (already exists, fix fallback)
- [ ] Remove test-user fallback OR require valid auth
- [ ] Add production CORS domains

### PR #2 — Service Extraction (Refactoring)
- [ ] Create `app/services/scoring.py`
- [ ] Create `app/services/credits.py`
- [ ] Create `app/services/profile.py`
- [ ] Update routes to use services

### PR #3 — Validation & Error Handling
- [ ] Add Pydantic schemas for all inputs
- [ ] Add centralized error handler
- [ ] Add request logging

### PR #4 — Worker Improvements
- [ ] Add structured logging
- [ ] Add exponential backoff retry
- [ ] Fix asyncio.run usage

### PR #5 — Frontend Polish
- [ ] Add environment config for API URL
- [ ] Add error boundaries
- [ ] Add Suspense + loading states
- [ ] Remove hardcoded bento-grid values

### PR #6 — Test Coverage
- [ ] Test credit operations
- [ ] Test scoring logic
- [ ] Test resume extraction
- [ ] Test LLM JSON parsing

---

## ✅ ACCEPTABLE FOR TESTING

These issues are acceptable **for now** since the app is internal testing only:

1. Hardcoded bento-grid values (mock data fine)
2. Localhost API URL (dev environment)
3. Duplicate match score logic (works, just needs refactor)
4. No service layer (functional)
5. Business logic in routes (easier to debug locally)
6. No tests (can add later)
7. LLM prompts embedded (harder to change, but works)

---

## ❌ NOT ACCEPTABLE FOR PRODUCTION

1. Hardcoded upload path → will fail on deployment
2. Hardcoded DB credentials → security risk
3. Silent auth fallback → unaudited access
4. CORS localhost only → won't work for users

---

## 🐛 TYPE ERRORS (LSP Detected)

The Python type checker found these issues:

### jobs.py
| Line | Error |
|------|-------|
| 27-31 | `Cannot assign to attribute "balance" for class "Credit"` - Using ColumnElement instead of actual value |
| 30-31 | `Cannot assign to attribute "lifetime_used"` - Same issue |
| 102-106 | Same pattern in apply_to_job |

### applications.py
| Line | Error |
|------|-------|
| 39,42,43 | `Invalid conditional operand of type "Column[datetime]"` - Using in bool check |
| 82,85,86 | Same datetime issue |
| 113-114 | String literal not assignable to Column |
| 119-120 | Same ColumnElement issue |

### credits.py
| Line | Error |
|------|-------|
| 48 | `Cannot assign to attribute "balance"` - ColumnElement issue |

### resumes.py (Most Issues)
| Line | Error |
|------|-------|
| 34,44 | Invalid conditional on datetime Column |
| 41 | Argument of type Column[str] to len() |
| 51 | None not assignable to dict |
| 81 | Path not assignable to str (docx) |
| 98,101 | endswith/split on None |
| 114,130,136,150,195,260,278,295 | Column[UUID] not assignable to UUID |
| 126 | str not assignable to Column |
| 255 | Literal not assignable to Column |
| 354 | bytes \| None not assignable |

**Root Cause:** SQLAlchemy ORM queries return Column objects, not values. Need `.first()` properly or use `.scalar()`.

---

## 📦 FILES SUMMARY

```
applymate/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app (42 lines)
│   │   ├── api/routes/                # API endpoints
│   │   │   ├── jobs.py                # 196 lines ⚠️ duplicate logic
│   │   │   ├── applications.py        # 132 lines
│   │   │   ├── resumes.py              # 447 lines ⚠️ embedded prompts
│   │   │   ├── credits.py             # 64 lines
│   │   │   ├── users.py               # ?
│   │   │   └── auth.py                # 56 lines ⚠️ auth fallback
│   │   ├── services/
│   │   │   ├── database.py             # 140 lines ⚠️ hardcoded creds
│   │   │   ├── auth.py
│   │   │   └── supabase.py
│   │   └── workers/
│   │       ├── applicator.py           # 84 lines ⚠️ no structured logging
│   │       └── resume_crafter.py       # 146 lines ⚠️ duplicate scoring
│   └── celery_app.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # 689 lines ⚠️ too large
│   │   ├── dashboard/page.tsx         # 97 lines
│   │   └── resumes/page.tsx            # ?
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── bento-grid.tsx         # ⚠️ hardcoded values
│   │   │   └── ...
│   │   └── ui/                        # OK
│   └── lib/
│       └── utils.ts                    # OK (cn helper)
├── src/                               # ⚠️ appears unused
├── scripts/
│   └── git-workflow.sh                # ✓ useful
├── .env                               # ⚠️ has placeholder keys
└── requirements.txt
```

---

## 🎯 ACTION ITEMS

### Right Now (Before Continue Testing)

1. ⚠️ **STOP**: Don't deploy to any public-facing URL
2. ⚠️ **STOP**: Don't share with external users

### Before Production Release

1. Fix 4 critical security items (PR #1)
2. Add input validation (PR #3)
3. Add error boundaries (PR #5)
4. Remove hardcoded paths (PR #1)

### Anytime (Backlog)

- Refactor duplicates (PR #2)
- Add tests (PR #6)
- Worker improvements (PR #4)
- Frontend polish (PR #5)

---

**End of Report**
