import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { loadConfig } from './config.js';
import { connectToServer, getConnection } from './opencode/client.js';
import { subscribeToGlobalEvents } from './opencode/sse-subscriber.js';
import { WsBroadcastServer } from './ws/server.js';
import * as engine from './engine.js';
import * as eventStore from './store.js';

const config = loadConfig();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ---- REST endpoints ----

app.get('/health', (_req, res) => {
  const conn = getConnection();
  res.json({
    status: 'ok',
    opencode: conn ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    sessions: {
      active: engine.getRunningCount(),
      stored: eventStore.listSessions().length,
    },
  });
});

app.get('/modes', (_req, res) => {
  res.json({ modes: config.modes });
});

app.post('/trigger', async (req, res) => {
  try {
    const { mode, args } = req.body ?? {};
    if (!mode || typeof mode !== 'string') {
      return res.status(400).json({ error: 'mode is required' });
    }

    const sessionId = await engine.executeMode(mode, args ?? {});
    res.status(200).json({ session_id: sessionId, mode, status: 'started' });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'trigger failed' });
  }
});

app.get('/sessions', (_req, res) => {
  const sessions = eventStore.listSessions();
  res.json({ sessions });
});

app.get('/sessions/:id', (req, res) => {
  const session = eventStore.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'session not found' });
  }
  res.json({ session });
});

app.get('/sessions/:id/events', (req, res) => {
  const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;
  const events = eventStore.getEvents(req.params.id, since);
  res.json({ events });
});

app.get('/sessions/:id/result', (req, res) => {
  const session = eventStore.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'session not found' });
  }
  const events = eventStore.getEvents(req.params.id);
  const lastCmd = events.filter((e) => e.type === 'command_executed').pop();
  const lastError = events.filter((e) => e.type === 'error').pop();
  res.json({
    session_id: session.id,
    mode: session.mode,
    status: session.status,
    result: lastCmd ? { command: lastCmd.command, result: lastCmd.result } : null,
    error: lastError?.message ?? null,
    events_count: events.length,
    duration_ms: session.endTime ? session.endTime - session.startTime : null,
  });
});

app.post('/sessions/:id/abort', async (req, res) => {
  try {
    await engine.abortSession(req.params.id);
    res.json({ status: 'aborted', session_id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'abort failed' });
  }
});

// ---- WebSocket server ----

const wsServer = new WsBroadcastServer(config.wsSecret);

// integrate WS broadcasts with event system
import { setBroadcastHandler } from './opencode/events.js';
setBroadcastHandler((sessionId, event) => {
  wsServer.broadcast(event, sessionId);
  eventStore.append(sessionId, event);
});

// ---- Start ----

const httpServer = createServer(app);
wsServer.attach(httpServer);

httpServer.listen(config.sidecarPort, async () => {
  console.log(`sidecar REST listening on :${config.sidecarPort}`);
  console.log(`sidecar WS listening on same port`);

  // connect to opencode server
  try {
    await connectToServer(config.opencodeHost, config.opencodePort);
    console.log(`connected to opencode at ${config.opencodeHost}:${config.opencodePort}`);

    // subscribe to SSE events for real-time session updates
    await subscribeToGlobalEvents();
  } catch (err) {
    console.warn(`failed to connect to opencode: ${err}`);
  }
});

export { app, httpServer, wsServer };
