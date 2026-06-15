import type { AgentSession, AgentEvent, SessionStatus } from './types.js';

interface StoredSession {
  session: AgentSession;
  updatedAt: number;
}

const DEFAULT_MAX_EVENTS = 1000;
const IDLE_CLEANUP_MS = 60 * 60 * 1000; // 1 hour

const sessions = new Map<string, StoredSession>();

function getNow(): number {
  return Date.now();
}

function isExpired(stored: StoredSession): boolean {
  return getNow() - stored.updatedAt > IDLE_CLEANUP_MS;
}

export function append(sessionId: string, event: AgentEvent): void {
  let stored = sessions.get(sessionId);
  if (!stored) {
    stored = {
      session: {
        id: sessionId,
        mode: '',
        status: 'idle',
        events: [],
        startTime: getNow(),
      },
      updatedAt: getNow(),
    };
    sessions.set(sessionId, stored);
  }

  stored.updatedAt = getNow();
  stored.session.events.push(event);

  if (stored.session.events.length > DEFAULT_MAX_EVENTS) {
    stored.session.events = stored.session.events.slice(-DEFAULT_MAX_EVENTS);
  }
}

export function updateSessionStatus(sessionId: string, status: SessionStatus): void {
  const stored = sessions.get(sessionId);
  if (stored) {
    stored.session.status = status;
    stored.updatedAt = getNow();
    if (status === 'done' || status === 'error') {
      stored.session.endTime = getNow();
    }
  }
}

export function updateSessionMeta(sessionId: string, meta: Partial<AgentSession>): void {
  const stored = sessions.get(sessionId);
  if (stored) {
    Object.assign(stored.session, meta);
    stored.updatedAt = getNow();
  }
}

export function getEvents(sessionId: string, since?: number): AgentEvent[] {
  const stored = sessions.get(sessionId);
  if (!stored) return [];
  if (since !== undefined) {
    return stored.session.events.filter((e) => e.timestamp > since);
  }
  return [...stored.session.events];
}

export function getSession(sessionId: string): AgentSession | undefined {
  const stored = sessions.get(sessionId);
  if (!stored) return undefined;
  if (isExpired(stored)) {
    sessions.delete(sessionId);
    return undefined;
  }
  return { ...stored.session };
}

export function listSessions(): AgentSession[] {
  const now = getNow();
  const results: AgentSession[] = [];
  for (const [id, stored] of sessions) {
    if (isExpired(stored)) {
      sessions.delete(id);
      continue;
    }
    results.push({ ...stored.session });
  }
  return results;
}

export function cleanup(sessionId: string): void {
  sessions.delete(sessionId);
}

export function cleanupExpired(): number {
  let count = 0;
  for (const [id, stored] of sessions) {
    if (isExpired(stored)) {
      sessions.delete(id);
      count++;
    }
  }
  return count;
}

// Auto-cleanup interval
setInterval(cleanupExpired, 5 * 60 * 1000);
