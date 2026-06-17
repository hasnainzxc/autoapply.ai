import type { AgentEvent } from '../types.js';

export interface WsClientSubscribe {
  type: 'subscribe';
  sessionId?: string;
  token?: string;
}

export interface WsClientUnsubscribe {
  type: 'unsubscribe';
  sessionId?: string;
}

export interface WsClientPing {
  type: 'ping';
}

export interface WsClientCommand {
  type: 'command';
  payload?: Record<string, unknown>;
}

export type WsClientMessage =
  | WsClientSubscribe
  | WsClientUnsubscribe
  | WsClientPing
  | WsClientCommand;

export interface WsServerEvent {
  type: 'event';
  event: AgentEvent;
}

export interface WsServerPong {
  type: 'pong';
}

export interface WsServerError {
  type: 'error';
  message: string;
}

export type WsServerMessage = WsServerEvent | WsServerPong | WsServerError;
