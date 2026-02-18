applymate/
├── backend/                           # FastAPI
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── auth.py               # Clerk webhooks
│   │   │   ├── users.py              # User profiles
│   │   │   ├── jobs.py               # Job analysis/apply
│   │   │   ├── applications.py        # Application CRUD
│   │   │   └── credits.py            # Credit system
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   └── application.py
│   │   ├── services/
│   │   │   └── supabase.py
│   │   ├── workers/
│   │   │   ├── resume_crafter.py     # Celery tasks
│   │   │   └── applicator.py         # Browser automation
│   │   └── main.py
│   ├── celery_app.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                          # Next.js 15
│   ├── app/
│   │   ├── (auth)/sign-in/
│   │   ├── (auth)/sign-up/
│   │   ├── (dashboard)/page.tsx     # Main dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/dashboard/
│   │   ├── bento-grid.tsx
│   │   ├── active-agents.tsx
│   │   ├── recent-applications.tsx
│   │   ├── credit-balance.tsx
│   │   └── add-job-button.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example
│
├── src/                              # Standalone scraper
│   ├── config.py
│   ├── job_scraper.py
│   ├── minimax_client.py
│   └── logger.py
│
├── config/
│   └── config.yaml
│
├── docs/
│   └── system_spec.md                # Full architecture docs
│
├── run.py                            # Standalone CLI runner
└── requirements.txt                  # Standalone dependencies
