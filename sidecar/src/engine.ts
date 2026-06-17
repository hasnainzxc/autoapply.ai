// Mode execution engine
// Orchestrates full lifecycle: create session -> execute command -> stream events -> store result

import * as opencodeClient from './opencode/client.js';
import * as eventStore from './store.js';
import { emitEvent, parseRawEvent, createSessionStatusEvent, createErrorEvent } from './opencode/events.js';
import type { AgentEvent, SessionStatus } from './types.js';

const MAX_CONCURRENT = 3;
const MODE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

interface RunningSession {
  sessionId: string;
  mode: string;
  args: Record<string, unknown>;
  startedAt: number;
  timeoutTimer: NodeJS.Timeout;
  abortController: AbortController;
}

const running = new Map<string, RunningSession>();

function canStart(): boolean {
  return running.size < MAX_CONCURRENT;
}

export function getRunningCount(): number {
  return running.size;
}

export async function executeMode(
  mode: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  if (!canStart()) {
    throw new Error(`max concurrent sessions (${MAX_CONCURRENT}) reached`);
  }

  const conn = opencodeClient.getConnection();
  if (!conn) {
    throw new Error('opencode server not connected');
  }

  // create session via SDK (normalize mode prefix for title)
  const titleMode = mode.startsWith('career-ops-') ? mode.slice('career-ops-'.length) : mode;
  const sdkSession = await opencodeClient.createSession(`career-ops-${titleMode}-${Date.now()}`);
  const sessionId: string = sdkSession.id ?? sdkSession.sessionId ?? `fallback-${Date.now()}`;

  // init store
  eventStore.updateSessionMeta(sessionId, {
    id: sessionId,
    mode,
    status: 'busy',
    startTime: Date.now(),
  });

  const abortController = new AbortController();

  const timeoutTimer = setTimeout(() => {
    abortController.abort();
    eventStore.updateSessionStatus(sessionId, 'error');
    emitEvent(sessionId, createErrorEvent('mode execution timed out', sessionId, 'TIMEOUT'));
    running.delete(sessionId);
  }, MODE_TIMEOUT_MS);

  const runningSession: RunningSession = {
    sessionId,
    mode,
    args,
    startedAt: Date.now(),
    timeoutTimer,
    abortController,
  };
  running.set(sessionId, runningSession);

  emitEvent(sessionId, createSessionStatusEvent('busy', sessionId));

  // execute async, fire-and-forget
  executeCommand(sessionId, mode, args, abortController.signal).finally(() => {
    clearTimeout(timeoutTimer);
    running.delete(sessionId);
  });

  return sessionId;
}

async function executeCommand(
  sessionId: string,
  mode: string,
  args: Record<string, unknown>,
  signal: AbortSignal
): Promise<void> {
  try {
    // determine career-ops command name
    // Mode might be "scan" or "career-ops-scan" — normalize
    const prefix = 'career-ops-';
    const commandName = mode.startsWith(prefix) ? mode : `${prefix}${mode}`;

    // send via SDK (fire-and-forget; SSE events handle completion)
    await opencodeClient.sendCommand(sessionId, commandName, args);

    console.log(`engine: command sent for session ${sessionId.slice(0, 20)}...`);
    // DO NOT mark done here — SSE subscriber will handle status updates
    // Session stays "busy" until headless sends completion event
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error(`engine: command error for ${sessionId.slice(0, 20)}...:`, msg);
    eventStore.updateSessionStatus(sessionId, 'error');
    emitEvent(sessionId, createErrorEvent(msg, sessionId, 'EXEC_ERROR'));

    if (signal.aborted) {
      emitEvent(sessionId, createErrorEvent('execution aborted', sessionId, 'ABORTED'));
    }
  }
}

export async function abortSession(sessionId: string): Promise<void> {
  const rs = running.get(sessionId);
  if (rs) {
    rs.abortController.abort();
    clearTimeout(rs.timeoutTimer);
    running.delete(sessionId);
  }

  await opencodeClient.abortSession(sessionId);
  eventStore.updateSessionStatus(sessionId, 'error');
  emitEvent(sessionId, createErrorEvent('session aborted by user', sessionId, 'USER_ABORT'));
}
