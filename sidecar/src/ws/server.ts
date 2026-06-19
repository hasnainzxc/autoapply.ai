// WebSocket broadcast server
// Manages client connections, broadcasts events, heartbeat

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import type { AgentEvent } from '../types.js';
import type { WsClientMessage, WsServerMessage } from './types.js';

interface ClientInfo {
  id: string;
  ws: WebSocket;
  connectedAt: number;
  subscribedSessions: Set<string>;
  metadata: Record<string, unknown>;
}

export type WsCommandHandler = (
  type: 'chat' | 'command',
  payload: { text?: string; command?: string; sessionId?: string; args?: Record<string, unknown> }
) => Promise<void>;

const HEARTBEAT_INTERVAL = 30_000;
const HEARTBEAT_TIMEOUT = 10_000;

export class WsBroadcastServer {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ClientInfo>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private _secret: string;
  private _commandHandler: WsCommandHandler | null = null;

  constructor(secret: string = '') {
    this._secret = secret;
  }

  setCommandHandler(handler: WsCommandHandler | null): void {
    this._commandHandler = handler;
  }

  get clientCount(): number {
    return this.clients.size;
  }

  attach(httpServer: HttpServer): void {
    this.wss = new WebSocketServer({ server: httpServer });
    this.setup();
  }

  listen(port: number): HttpServer {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    this.setup();
    server.listen(port);
    return server;
  }

  private setup(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const client: ClientInfo = {
        id: clientId,
        ws,
        connectedAt: Date.now(),
        subscribedSessions: new Set(),
        metadata: {},
      };
      this.clients.set(clientId, client);

      ws.on('message', (raw) => {
        try {
          const msg: WsClientMessage = JSON.parse(raw.toString());
          this.handleMessage(clientId, msg);
        } catch {
          this.sendTo(clientId, { type: 'error', message: 'invalid JSON' });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.on('error', () => {
        this.clients.delete(clientId);
      });
    });

    this.startHeartbeat();
  }

  private handleMessage(clientId: string, msg: WsClientMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (msg.type) {
      case 'ping':
        this.sendTo(clientId, { type: 'pong' });
        break;

      case 'subscribe':
        if (msg.sessionId) {
          client.subscribedSessions.add(msg.sessionId);
        }
        break;

      case 'unsubscribe':
        if (msg.sessionId) {
          client.subscribedSessions.delete(msg.sessionId);
        } else {
          client.subscribedSessions.clear();
        }
        break;

      case 'command':
        if (this._commandHandler && msg.command) {
          this._commandHandler('command', { command: msg.command, sessionId: msg.sessionId, args: msg.args });
        }
        break;

      case 'chat':
        if (this._commandHandler && msg.text) {
          this._commandHandler('chat', { text: msg.text, sessionId: msg.sessionId });
        }
        break;
    }
  }

  broadcast(event: AgentEvent, sessionId?: string): void {
    const msg: WsServerMessage = { type: 'event', event };

    for (const client of this.clients.values()) {
      if (
        client.ws.readyState === WebSocket.OPEN &&
        (!sessionId || client.subscribedSessions.size === 0 || client.subscribedSessions.has(sessionId))
      ) {
        try {
          client.ws.send(JSON.stringify(msg));
        } catch {
          // skip dead connection
        }
      }
    }
  }

  sendTo(clientId: string, msg: WsServerMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(msg));
      } catch {
        // skip
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const [id, client] of this.clients) {
        if (client.ws.readyState !== WebSocket.OPEN) {
          this.clients.delete(id);
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const client of this.clients.values()) {
      client.ws.close();
    }
    this.clients.clear();
    this.wss?.close();
  }
}
