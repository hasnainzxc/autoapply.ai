// SSE event subscriber
// Connects to headless OpenCode server's /global/event SSE stream
// Forwards normalized events to sidecar store and WS broadcast

import * as eventStore from '../store.js';
import { emitEvent, parseRawEvent, createSessionStatusEvent, createErrorEvent } from './events.js';
import { getConnection } from './client.js';

let globalSseStream: any = null;
let globalAbortController: AbortController | null = null;

export function isSubscribed(): boolean {
  return globalSseStream !== null;
}

export async function subscribeToGlobalEvents(): Promise<void> {
  if (globalSseStream) return; // already subscribed

  const conn = getConnection();
  if (!conn) {
    console.warn('SSE: no opencode connection, cannot subscribe');
    return;
  }

  if (!conn.client.global?.event) {
    console.warn('SSE: SDK client has no global.event() method, skipping');
    return;
  }

  globalAbortController = new AbortController();

  try {
    console.log('SSE: subscribing to global events...');
    const result = await conn.client.global.event({
      signal: globalAbortController.signal,
    });

    globalSseStream = result.stream;
    console.log('SSE: subscribed successfully');

    // Process events asynchronously
    processEventStream().catch((err) => {
      console.error('SSE: event stream error:', err);
      globalSseStream = null;
    });
  } catch (err) {
    console.error('SSE: failed to subscribe:', err);
    globalSseStream = null;
  }
}

export function unsubscribeFromGlobalEvents(): void {
  if (globalAbortController) {
    globalAbortController.abort();
    globalAbortController = null;
  }
  globalSseStream = null;
  console.log('SSE: unsubscribed');
}

async function processEventStream(): Promise<void> {
  const stream = globalSseStream;
  if (!stream) return;

  try {
    for await (const event of stream) {
      if (!event) continue;

      // /global/event wraps payload in { directory?, project?, payload: { type, properties, ... } }
      const payload = event.payload ?? event;
      if (!payload || !payload.type) continue;

      const rawType: string = payload.type ?? '';
      const rawProps: Record<string, any> = payload.properties ?? {};
      const sessionId: string = rawProps?.sessionID ?? rawProps?.sessionId ?? '';

      // Skip events without session
      if (!sessionId) continue;

      // Skip heartbeat/connection events
      if (rawType === 'server.connected') continue;

      // Normalize to AgentEvent
      const agentEvent = parseRawEvent(
        {
          type: rawType,
          ...rawProps,
          timestamp: payload.time ?? event.time ?? Date.now(),
        },
        sessionId
      );

      if (!agentEvent) {
        // Log unknown event types for debugging
        if (!rawType.includes('heartbeat') && !rawType.includes('connected')) {
          console.debug('SSE: unhandled event type:', rawType, sessionId.slice(0, 20));
        }
        continue;
      }

      // Emit event (broadcast handler stores + pushes to WS)
      emitEvent(sessionId, agentEvent);

      // Update session status based on events
      if (agentEvent.type === 'session_status') {
        eventStore.updateSessionStatus(sessionId, agentEvent.status as any);
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('SSE: stream processing error:', err);
    }
  }
}
