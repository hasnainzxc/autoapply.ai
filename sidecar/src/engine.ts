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

  // create session via SDK
  const sdkSession = await opencodeClient.createSession(`career-ops-${mode}-${Date.now()}`);
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
    const commandName = `career-ops-${mode}`;

    // send via SDK
    await opencodeClient.sendCommand(sessionId, commandName, args);

    // since we use mock client, mark done immediately
    // real SDK will use SSE events for completion
    eventStore.updateSessionStatus(sessionId, 'done');
    emitEvent(sessionId, createSessionStatusEvent('done', sessionId));

    // push a mock result event
    emitEvent(sessionId, {
      type: 'command_executed',
      command: commandName,
      result: JSON.stringify({ mode, args, status: 'completed', sessionId }),
      sessionId,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
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
