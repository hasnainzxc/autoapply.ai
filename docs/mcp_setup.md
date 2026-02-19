# ApplyMate — MCP Setup Guide

This guide explains how to set up all MCP (Model Context Protocol) servers for the ApplyMate OpenCode + Antigravity workflow.

---

## Quick Start

The `opencode.json` at the project root is pre-configured with all 8 MCPs.

1. Copy the env template: `cp .env.example .env`
2. Fill in all keys in `.env`
3. Start OpenCode from the project root: `opencode .`
4. Verify MCPs are running: `opencode mcp list`

---

## MCP Servers Overview

| MCP | Priority | Package | Status |
|-----|----------|---------|--------|
| `filesystem` | 🔴 Critical | `@modelcontextprotocol/server-filesystem` | Auto-enabled |
| `playwright` | 🔴 Critical | `@playwright/mcp` | Auto-enabled |
| `supabase` | 🔴 Critical | `@modelcontextprotocol/server-postgres` | Needs `SUPABASE_DB_URL` |
| `fetch` | 🟠 High | `@modelcontextprotocol/server-fetch` | Auto-enabled |
| `memory` | 🟠 High | `@modelcontextprotocol/server-memory` | Auto-enabled |
| `github` | 🟠 High | `@modelcontextprotocol/server-github` | Needs `GITHUB_PAT` |
| `redis` | 🟠 High | `@redis/mcp-redis` | Needs `REDIS_URL` |
| `stripe` | 🟡 Later | `@stripe/mcp` | Disabled (Phase 5) |

---

## MCP Details

### 1. 📁 Filesystem MCP
**What it does:** Gives OpenCode direct read/write access to the entire ApplyMate monorepo — navigates between `backend/`, `frontend/`, `src/`, `config/` without manual file-switching.

**Required env:** None  
**Auto-installs:** Yes (via `npx -y`)

---

### 2. 🌐 Playwright MCP
**What it does:** Lets the AI directly control a browser — test selectors, scrape real job URLs, debug the `JobScraper`, and prototype the `applicator.py` form-filling logic.

**Required env:** None  
**Auto-installs:** Yes

> **Tip:** Use this when `apply_button_selectors` in `config.yaml` aren't matching a specific portal (Workday, Lever, Greenhouse).

---

### 3. 🗄️ Supabase (Postgres) MCP
**What it does:** Live SQL queries against your Supabase database — inspect tables, debug RLS policies, check application status rows, and verify Celery worker results.

**Required env:** `SUPABASE_DB_URL`

```
# Get this from Supabase Dashboard → Settings → Database → Connection string
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

**Auto-installs:** Yes

---

### 4. 🔍 Fetch MCP
**What it does:** Fetches real web content (job posting URLs) and converts HTML to markdown — used for testing the scraper logic against real job boards without launching Playwright.

**Required env:** None  
**Auto-installs:** Yes

---

### 5. 🧠 Memory MCP
**What it does:** Persistent memory across OpenCode sessions — remembers which Celery tasks are stubs, what phase you're on, known bugs, and architectural decisions.

**Required env:** None  
**Auto-installs:** Yes

---

### 6. 🐙 GitHub MCP
**What it does:** Create issues, PRs, and branches directly from the AI — useful for tracking phase progress (Phase 2 → 3 → 4) and managing feature work.

**Required env:** `GITHUB_PAT`

```
# Create at: https://github.com/settings/tokens
# Scopes needed: repo, pull_requests, issues
GITHUB_PAT=github_pat_xxx
```

---

### 7. ⚡ Redis MCP
**What it does:** Inspect Celery task queues — see queued/running/failed tasks, check queue depth, peek at task states when `resume_crafter_task` or `apply_to_job_task` gets stuck.

**Required env:** `REDIS_URL`

```
# Default local Redis
REDIS_URL=redis://localhost:6379/0
```

---

### 8. 💳 Stripe MCP (Disabled — Phase 5)
**What it does:** Create test customers, simulate credit purchases, inspect webhooks — for Phase 5 payment integration.

**Required env:** `STRIPE_SECRET_KEY`  
**Status:** Disabled in `opencode.json` until you reach Phase 5. Enable by setting `"enabled": true` in `opencode.json`.

---

## Enabling/Disabling MCPs

Edit `opencode.json` in the project root:

```json
"stripe": {
  "enabled": true,   // ← flip this
  ...
}
```

---

## Troubleshooting

**MCP not starting?**
```bash
opencode mcp list
```
Check which servers are `running` vs `error`.

**Supabase MCP can't connect?**
- Verify `SUPABASE_DB_URL` is set in your `.env`
- Make sure IP is allowlisted in Supabase Dashboard → Settings → Database

**Playwright MCP errors?**
```bash
# Install browsers
npx playwright install chromium
```

**Redis MCP can't connect?**
- Make sure Redis is running: `redis-cli ping` should return `PONG`
- Start Redis: `sudo systemctl start redis` or `redis-server`
