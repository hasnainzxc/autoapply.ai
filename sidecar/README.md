# Sidecar

Node.js SDK sidecar connecting AutoApplyAI to OpenCode career-ops. Serves as a REST + WebSocket bridge between the FastAPI backend and OpenCode headless server.

## Architecture

```
FastAPI (:8000)
  |  opencode_client.py (HTTP)
  |  use-agent-stream.ts (WS)
  v
Sidecar Node.js (:4197)
  |  REST: /health, /trigger, /sessions, /modes
  |  WS: event broadcast
  v
OpenCode Headless (:4196)
  |  @opencode-ai/sdk or mock client
  v
Career-Ops Repository
  |  opencode.json commands (career-ops-*)
  v
Job boards (Greenhouse, Ashby, LinkedIn, etc.)
```

Sidecar sits between FastAPI and OpenCode. It translates REST calls into OpenCode SDK commands, streams events back via WebSocket, and stores session state in memory.

## Directory Structure

```
sidecar/
  src/
    index.ts           Express server, REST routes, WS attach
    config.ts          Env-driven config loader, career-ops mode discovery
    engine.ts          Session lifecycle: create, execute, timeout, abort
    store.ts           In-memory event store with TTL cleanup
    types.ts           TypeScript types for events, sessions, config
    modes/
      index.ts         Re-exports all mode handlers
      schema.ts        Input/output type definitions
      scan.ts          Scan job boards
      evaluate.ts      Evaluate job match
      apply.ts         Submit application
      pdf.ts           Generate PDF CV
      pipeline.ts      Batch pipeline processing
    opencode/
      client.ts        OpenCode SDK connection manager (real + mock)
      events.ts        Event normalization, subscription, broadcast
    ws/
      server.ts        WebSocket broadcast server
      types.ts         WS message types
  scripts/
    dev.sh             Dev startup: opencode + sidecar
  Procfile             Process manager entry
  .env.example         Environment template
  package.json
  tsconfig.json
```

## Setup

### Prerequisites

- Node.js 20+
- OpenCode CLI installed (`~/.opencode/bin/opencode`)
- Career-ops repository cloned locally

### Install

```bash
cd sidecar
npm install
```

### Configure

```bash
cp .env.example .env
# edit .env to match your setup
```

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SIDECAR_PORT` | `4197` | REST API port |
| `SIDECAR_WS_PORT` | `4198` | WebSocket port (legacy, actual WS on same port as REST) |
| `SIDECAR_WS_SECRET` | `dev-secret` | WS auth token |
| `OPENCODE_HOST` | `127.0.0.1` | OpenCode server host |
| `OPENCODE_PORT` | `4196` | OpenCode server port |
| `CAREER_OPS_PATH` | `~/prods/job_automation/career-ops` | Career-ops repo path |
| `LOG_LEVEL` | `info` | Logging verbosity |

### Systemd (production)

Enable the OpenCode headless server as a user service:

```bash
cp etc/opencode-serve.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable opencode-serve
systemctl --user start opencode-serve
```

The service runs `opencode serve` on `:4196` with auto-restart.

## Running

### Development (auto-reload)

```bash
npm run dev
```

Or use the dev script that starts both opencode and sidecar:

```bash
bash scripts/dev.sh
```

The dev script:
1. Checks if opencode is already running on `:4196`
2. If not, starts `opencode serve` in background
3. Waits for opencode to be ready (polls `/health`)
4. Starts sidecar with `tsx watch` (auto-reload on file changes)
5. Shuts down both on Ctrl+C

### Production

```bash
npm run build   # tsc -> dist/
npm start       # node dist/index.js
```

### Procfile

```bash
npx proc-start sidecar/Procfile
```

## REST API

All endpoints served on `http://localhost:4197`.

### Health

```http
GET /health

Response 200:
{
  "status": "ok",
  "opencode": "connected",
  "uptime": 1234.56,
  "sessions": {
    "active": 1,
    "stored": 5
  }
}
```

### List Modes

```http
GET /modes

Response 200:
{
  "modes": [
    {
      "id": "career-ops-scan",
      "name": "scan",
      "command": "career-ops-scan",
      "description": "Scan job boards for listings",
      "inputSchema": {},
      "outputType": "string"
    }
  ]
}
```

Modes are auto-discovered from `career-ops/opencode.json` commands prefixed with `career-ops-`.

### Trigger Mode

```http
POST /trigger
Content-Type: application/json

{
  "mode": "scan",
  "args": {
    "portal": "greenhouse",
    "keywords": "engineer",
    "location": "remote",
    "limit": 10
  }
}

Response 200:
{
  "session_id": "mock-1718534400000-abc12",
  "mode": "scan",
  "status": "started"
}

Response 400:
{
  "error": "mode is required"
}

Response 500:
{
  "error": "max concurrent sessions (3) reached"
}
```

Triggers a career-ops mode execution. Returns a `session_id` immediately. Progress is streamed via WebSocket events. Max 3 concurrent sessions, 10-minute timeout per session.

### List Sessions

```http
GET /sessions

Response 200:
{
  "sessions": [
    {
      "id": "mock-1718534400000-abc12",
      "mode": "scan",
      "status": "done",
      "events": [...],
      "startTime": 1718534400000,
      "endTime": 1718534405000
    }
  ]
}
```

Sessions expire after 1 hour of inactivity.

### Get Session

```http
GET /sessions/:id

Response 200:
{
  "session": {
    "id": "mock-1718534400000-abc12",
    "mode": "scan",
    "status": "done",
    "events": [...],
    "startTime": 1718534400000,
    "endTime": 1718534405000
  }
}

Response 404:
{
  "error": "session not found"
}
```

### Get Session Events

```http
GET /sessions/:id/events?since=1718534400000

Response 200:
{
  "events": [
    {
      "type": "session_status",
      "status": "busy",
      "sessionId": "mock-...",
      "timestamp": 1718534400100
    },
    {
      "type": "command_executed",
      "command": "career-ops-scan",
      "result": "{\"mode\":\"scan\",\"args\":{},\"status\":\"completed\",\"sessionId\":\"...\"}",
      "sessionId": "mock-...",
      "timestamp": 1718534405000
    }
  ]
}
```

The `since` query parameter filters events after a Unix timestamp (ms). Omit to return all events.

### Get Session Result

```http
GET /sessions/:id/result

Response 200:
{
  "session_id": "mock-1718534400000-abc12",
  "mode": "scan",
  "status": "done",
  "result": {
    "command": "career-ops-scan",
    "result": "{\"mode\":\"scan\",\"args\":{},\"status\":\"completed\",\"sessionId\":\"...\"}"
  },
  "error": null,
  "events_count": 4,
  "duration_ms": 5000
}
```

Convenience endpoint that extracts the last `command_executed` event and last `error` event from session history.

### Abort Session

```http
POST /sessions/:id/abort

Response 200:
{
  "status": "aborted",
  "session_id": "mock-1718534400000-abc12"
}
```

Aborts a running session: cancels the SDK command, clears the timeout timer, and sets session status to `error`.

## Mode Handlers

Five mode handlers are implemented. Each translates REST args into career-ops CLI command args, delegates execution to OpenCode, and parses the raw output.

### Scan

Input:
```typescript
interface ScanInput {
  portal?: string;    // greenhouse, linkedin, indeed, etc.
  keywords?: string;  // search keywords
  location?: string;  // job location filter
  limit?: number;     // max results
}
```

Output: `JobListing[]`

Command: `career-ops-scan --portal greenhouse --keywords engineer --location remote --limit 10`

Normalizes job listings from various sources into a uniform schema:

```typescript
interface JobListing {
  title: string;
  company: string;
  location: string;
  url: string;
  portal: string;
  postedDate?: string;
  salaryRange?: string;
  description?: string;
}
```

### Evaluate

Input:
```typescript
interface EvaluateInput {
  jobUrl: string;
  company?: string;
  jobTitle?: string;
}
```

Output:
```typescript
interface EvaluationResult {
  score: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  reasoning: string;
}
```

Command: `career-ops-evaluate --url <jobUrl> --company Acme --title "Engineer"`

### Apply

Input:
```typescript
interface ApplyInput {
  jobUrl: string;
  cvPath?: string;
  coverLetter?: string;
}
```

Output:
```typescript
interface ApplyResult {
  status: 'submitted' | 'failed' | 'requires_manual';
  confirmationUrl?: string;
  errorMessage?: string;
}
```

Command: `career-ops-apply --url <jobUrl> --cv /path/to/cv.pdf --cover-letter "Dear..."`

### PDF

Input:
```typescript
interface PdfInput {
  template?: string;    // template name/id
  outputPath?: string;  // file output path
  format?: 'pdf' | 'latex';
}
```

Output:
```typescript
interface PdfResult {
  filePath: string;
  pages: number;
  fileSize: number;
}
```

Command: `career-ops-pdf --template modern --output /tmp/cv.pdf --format pdf`

### Pipeline

Input:
```typescript
interface PipelineInput {
  limit?: number;  // batch size
  url?: string;    // single job URL override
}
```

Output:
```typescript
interface PipelineResult {
  processed: number;
  failed: number;
  skipped: number;
  summary: string;
  entries: PipelineEntry[];
}
```

Command: `career-ops-pipeline --limit 5 --url <jobUrl>`

## WebSocket

WebSocket runs on the same port as REST (`:4197` via `WsBroadcastServer.attach()`).

### Connection

```typescript
const ws = new WebSocket("ws://localhost:4197");
```

### Client Messages

```typescript
// Subscribe to a specific session
{ "type": "subscribe", "sessionId": "mock-..." }

// Unsubscribe from a session
{ "type": "unsubscribe", "sessionId": "mock-..." }

// Unsubscribe from all sessions
{ "type": "unsubscribe" }

// Heartbeat ping
{ "type": "ping" }
```

### Server Messages

```typescript
// Event broadcast (sent when subscribed or globally if no subscription)
{
  "type": "event",
  "event": {
    "type": "session_status",
    "status": "busy",
    "sessionId": "mock-...",
    "timestamp": 1718534400100
  }
}

// Pong (heartbeat response)
{ "type": "pong" }

// Error
{ "type": "error", "message": "invalid JSON" }
```

### Event Types

| Type | Fields | Description |
|------|--------|-------------|
| `text_delta` | `text`, `sessionId`, `timestamp` | Agent text output (streaming) |
| `tool_call` | `toolName`, `args`, `sessionId`, `timestamp` | Agent tool invocation |
| `file_edit` | `filePath`, `action` (`create`/`modify`/`delete`), `sessionId`, `timestamp` | File modification event |
| `session_status` | `status` (`idle`/`busy`/`retry`/`done`/`error`), `sessionId`, `timestamp` | Session state change |
| `todo_update` | `todo` (`{content, status}`), `sessionId`, `timestamp` | Agent todo list update |
| `command_executed` | `command`, `result`, `sessionId`, `timestamp` | Command completion |
| `error` | `message`, `code?`, `sessionId`, `timestamp` | Error event |

### Broadcast Behavior

- Events are broadcast to all connected WS clients.
- If a client has `subscribe`d to a specific `sessionId`, they only receive events for that session.
- If a client has not subscribed to anything, they receive all events.
- Heartbeat pings every 30s with 10s timeout for stale connection cleanup.

### Frontend Integration

The frontend `use-agent-stream.ts` hook connects to the FastAPI WS proxy (`ws://localhost:8000/api/opencode/ws`) and manages reconnection with exponential backoff (max 5 attempts, 30s cap). The FastAPI WS proxy is a placeholder that will forward to the sidecar WS in production.

## Event Store

In-memory session store with:

- **Max events per session**: 1000 (oldest truncated)
- **TTL**: 1 hour since last update
- **Cleanup**: Expired sessions purged every 5 minutes automatically

```typescript
interface AgentSession {
  id: string;
  mode: string;
  status: 'idle' | 'busy' | 'retry' | 'done' | 'error';
  events: AgentEvent[];
  startTime: number;
  endTime?: number;
  result?: unknown;
  error?: string;
}
```

## Mock Client

When `@opencode-ai/sdk` is not installed, sidecar falls back to a mock client that simulates session creation and command queuing without connecting to a real OpenCode server. This allows frontend development and testing without the full stack.

```typescript
// Mock session response
{ id: "mock-1718534400000-abc12", title: "...", status: "idle" }

// Mock command response
{ sessionId: "mock-...", command: "career-ops-scan", status: "queued" }
```

The mock maintains an in-memory session map with `createSession`, `prompt`, `command`, `abort`, and `list` stubs.

## Backend Integration

FastAPI talks to sidecar via `OpendcodeClient` (`backend/app/services/opencode_client.py`):

```python
client = get_client()
session_id = await client.trigger_mode("scan", {"portal": "greenhouse"})
session = await client.get_session(session_id)
events = await client.get_session_events(session_id)
result = await client.get_session_result(session_id)
health = await client.get_health()
modes = await client.get_modes()
```

FastAPI routes (`/api/opencode/*`) proxy all sidecar endpoints:

| FastAPI Route | Sidecar Target |
|---------------|----------------|
| `GET /api/opencode/health` | `GET /health` |
| `GET /api/opencode/modes` | `GET /modes` |
| `POST /api/opencode/trigger?mode=scan` | `POST /trigger` |
| `GET /api/opencode/sessions` | `GET /sessions` |
| `GET /api/opencode/sessions/{id}` | `GET /sessions/{id}` |
| `GET /api/opencode/sessions/{id}/events` | `GET /sessions/{id}/events` |
| `GET /api/opencode/sessions/{id}/result` | `GET /sessions/{id}/result` |
| `POST /api/opencode/sessions/{id}/abort` | `POST /sessions/{id}/abort` |

A background health monitor (`opencode_monitor.py`) pings sidecar every 30s and logs connectivity changes.

## Career-Ops Integration

### Mode Discovery

On startup, sidecar reads `career-ops/opencode.json` and extracts all commands prefixed with `career-ops-`. Each becomes an available mode:

```json
{
  "command": {
    "career-ops-scan": { "description": "Scan job boards" },
    "career-ops-evaluate": { "description": "Evaluate job match" },
    "career-ops-apply": { "description": "Submit application" },
    "career-ops-pdf": { "description": "Generate PDF CV" },
    "career-ops-pipeline": { "description": "Batch pipeline" }
  }
}
```

### Data Flow

1. Frontend triggers mode via FastAPI `/api/opencode/trigger`
2. FastAPI proxies to sidecar `POST /trigger`
3. Sidecar creates OpenCode SDK session
4. Sidecar executes career-ops command via `sendCommand(sessionId, "career-ops-<mode>", args)`
5. Events stream back through sidecar event system
6. WebSocket broadcasts events to connected clients
7. Frontend `use-agent-stream` hook receives and renders events
8. Session result available at `GET /sessions/{id}/result`

## Development

### Type checking

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Tests

```bash
npm test
npm run test:watch
```

### Adding a new mode

1. Add the command to `career-ops/opencode.json` with a `career-ops-` prefix
2. Restart sidecar (modes auto-discover from config)
3. Optionally add a handler in `src/modes/` if output parsing is needed
4. Export from `src/modes/index.ts`

### Debugging

- Check sidecar health: `curl http://localhost:4197/health`
- Check opencode health: `curl http://127.0.0.1:4196/health`
- List sessions: `curl http://localhost:4197/sessions`
- Trigger scan mode: `curl -X POST http://localhost:4197/trigger -H 'Content-Type: application/json' -d '{"mode":"scan","args":{"portal":"greenhouse"}}'`
- WS monitoring: use `wscat -c ws://localhost:4197` or browser DevTools
- Enable debug logs: `LOG_LEVEL=debug npm run dev`
