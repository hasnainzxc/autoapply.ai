// SSE event stream consumer
// Subscribes to opencode server events, normalizes to AgentEvent

import type { AgentEvent } from '../types.js';

export type EventHandler = (event: AgentEvent) => void;

interface EventSubscription {
  sessionId: string;
  handlers: Set<EventHandler>;
  abortController: AbortController | null;
}

const subscriptions = new Map<string, EventSubscription>();

// Optional broadcast callback (set by WS server for real-time push)
let _broadcastHandler: ((sessionId: string, event: AgentEvent) => void) | null = null;

export function setBroadcastHandler(
  handler: ((sessionId: string, event: AgentEvent) => void) | null
): void {
  _broadcastHandler = handler;
}

function normalizeTimestamp(raw: any): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return new Date(raw).getTime();
  return Date.now();
}

function normalizeSessionId(raw: any, fallback: string): string {
  return raw?.sessionId ?? raw?.session_id ?? fallback;
}

export function createTextDelta(
  text: string,
  sessionId: string,
  ts?: number
): AgentEvent {
  return {
    type: 'text_delta',
    text,
    sessionId,
    timestamp: ts ?? Date.now(),
  };
}

export function createToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sessionId: string,
  ts?: number
): AgentEvent {
  return {
    type: 'tool_call',
    toolName,
    args,
    sessionId,
    timestamp: ts ?? Date.now(),
  };
}

export function createFileEdit(
  filePath: string,
  action: 'create' | 'modify' | 'delete',
  sessionId: string,
  ts?: number
): AgentEvent {
  return {
    type: 'file_edit',
    filePath,
    action,
    sessionId,
    timestamp: ts ?? Date.now(),
  };
}

export function createSessionStatusEvent(
  status: AgentEvent & { type: 'session_status' } extends { status: infer S }
    ? S
    : 'idle' | 'busy' | 'retry' | 'done' | 'error',
  sessionId: string,
  ts?: number
): AgentEvent {
  return {
    type: 'session_status',
    status,
    sessionId,
    timestamp: ts ?? Date.now(),
  } as AgentEvent;
}

export function createErrorEvent(
  message: string,
  sessionId: string,
  code?: string,
  ts?: number
): AgentEvent {
  return {
    type: 'error',
    message,
    code,
    sessionId,
    timestamp: ts ?? Date.now(),
  };
}

export async function subscribeToEvents(
  sessionId: string,
  handlers: EventHandler | EventHandler[]
): Promise<void> {
  const handlerList = Array.isArray(handlers) ? handlers : [handlers];
  const handlerSet = new Set(handlerList);

  let sub = subscriptions.get(sessionId);
  if (!sub) {
    const abortController = new AbortController();
    sub = {
      sessionId,
      handlers: new Set(),
      abortController,
    };
    subscriptions.set(sessionId, sub);
  }

  for (const h of handlerList) {
    sub.handlers.add(h);
  }
}

export function unsubscribeFromEvents(
  sessionId: string,
  handlers?: EventHandler | EventHandler[]
): void {
  const sub = subscriptions.get(sessionId);
  if (!sub) return;

  if (handlers) {
    const list = Array.isArray(handlers) ? handlers : [handlers];
    for (const h of list) {
      sub.handlers.delete(h);
    }
  }

  // clean up if no handlers left
  if (sub.handlers.size === 0) {
    sub.abortController?.abort();
    subscriptions.delete(sessionId);
  }
}

export function emitEvent(sessionId: string, event: AgentEvent): void {
  if (_broadcastHandler) {
    _broadcastHandler(sessionId, event);
  }

  const sub = subscriptions.get(sessionId);
  if (!sub) return;

  for (const handler of sub.handlers) {
    try {
      handler(event);
    } catch (err) {
      console.error(`event handler error for session ${sessionId}:`, err);
    }
  }
}

export function parseRawEvent(
  raw: any,
  sessionId: string
): AgentEvent | null {
  if (!raw || !raw.type) return null;

  const ts = normalizeTimestamp(raw.timestamp ?? raw.createdAt);
  const sid = normalizeSessionId(raw, sessionId);

  switch (raw.type) {
    case 'text_delta':
    case 'message.part.updated':
    case 'message.part.delta': {
      const text =
        raw.text ??
        raw.delta ??
        raw.content ??
        '';
      return { type: 'text_delta', text, sessionId: sid, timestamp: ts };
    }

    case 'session.status':
    case 'session_status': {
      const rawStatus = raw.status ?? raw.data?.status ?? 'busy';
      // Headless sends {status: {type: "busy"}} or {status: "busy"}
      const status = typeof rawStatus === 'string' ? rawStatus : rawStatus.type ?? 'busy';
      return { type: 'session_status', status, sessionId: sid, timestamp: ts } as AgentEvent;
    }

    case 'file.edited':
    case 'file_edit': {
      const filePath = raw.filePath ?? raw.path ?? '';
      const action = raw.action ?? raw.data?.action ?? 'modify';
      return { type: 'file_edit', filePath, action, sessionId: sid, timestamp: ts } as AgentEvent;
    }

    case 'todo.updated':
    case 'todo_updated': {
      const todo = raw.todo ?? raw.data?.todo ?? { content: '', status: '' };
      return { type: 'todo_update', todo, sessionId: sid, timestamp: ts } as AgentEvent;
    }

    case 'command.executed':
    case 'command_executed': {
      const cmd = raw.command ?? raw.data?.command ?? '';
      const result = raw.result ?? raw.data?.result ?? '';
      return { type: 'command_executed', command: cmd, result, sessionId: sid, timestamp: ts } as AgentEvent;
    }

    case 'tool_call':
    case 'tool.use': {
      const toolName = raw.toolName ?? raw.name ?? raw.data?.name ?? '';
      const args = raw.args ?? raw.data?.args ?? raw.input ?? {};
      return { type: 'tool_call', toolName, args, sessionId: sid, timestamp: ts } as AgentEvent;
    }

    case 'error': {
      const msg = raw.message ?? raw.data?.message ?? 'Unknown error';
      const code = raw.code ?? raw.data?.code;
      return { type: 'error', message: msg, code, sessionId: sid, timestamp: ts } as AgentEvent;
    }

    default:
      return null;
  }
}

export function getSubscriptionCount(): number {
  return subscriptions.size;
}
