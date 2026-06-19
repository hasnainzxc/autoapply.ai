import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { loadConfig } from './config.js';
import { connectToServer, getConnection, sendCommand as opencodeSendCommand, sendPrompt, createSession } from './opencode/client.js';
import { subscribeToGlobalEvents } from './opencode/sse-subscriber.js';
import { emitEvent, createSessionStatusEvent, createErrorEvent } from './opencode/events.js';
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
wsServer.setCommandHandler(async (type, payload) => {
  const conn = getConnection();
  if (!conn) return;

  try {
    if (type === 'command' && payload.command && payload.sessionId) {
      const prefix = 'career-ops-';
      const commandName = payload.command.startsWith(prefix) ? payload.command : `${prefix}${payload.command}`;
      await opencodeSendCommand(payload.sessionId, commandName, payload.args ?? {});
    } else if (type === 'chat' && payload.text && payload.sessionId) {
      await sendPrompt(payload.sessionId, payload.text);
    } else if (type === 'chat' && payload.text && !payload.sessionId) {
      // No sessionId — auto-create a session for free-form chat
      const sdkSession = await createSession(`chat-${Date.now()}`);
      const sessionId: string = sdkSession.id ?? sdkSession.sessionId ?? `fallback-${Date.now()}`;
      eventStore.updateSessionMeta(sessionId, { id: sessionId, mode: 'chat', status: 'busy', startTime: Date.now() });
      emitEvent(sessionId, createSessionStatusEvent('busy', sessionId));
      await sendPrompt(sessionId, payload.text);
    }
  } catch (err: any) {
    console.error('WS command handler error:', err?.message ?? String(err));
  }
});

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
