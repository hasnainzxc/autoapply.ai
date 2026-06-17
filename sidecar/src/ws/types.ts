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
  command: string;
  sessionId?: string;
  args?: Record<string, unknown>;
}

export interface WsClientChat {
  type: 'chat';
  text: string;
  sessionId?: string;
}

export type WsClientMessage =
  | WsClientSubscribe
  | WsClientUnsubscribe
  | WsClientPing
  | WsClientCommand
  | WsClientChat;

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
