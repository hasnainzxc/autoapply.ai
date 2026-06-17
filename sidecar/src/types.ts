// ---- Mode Definitions ----

export interface ModeDefinition {
  id: string;
  name: string;
  command: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputType: string;
}

// ---- Agent Events ----

export type SessionStatus = 'idle' | 'busy' | 'retry' | 'done' | 'error';

export interface EventTextDelta {
  type: 'text_delta';
  text: string;
  sessionId: string;
  timestamp: number;
}

export interface EventToolCall {
  type: 'tool_call';
  toolName: string;
  args: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
}

export interface EventFileEdit {
  type: 'file_edit';
  filePath: string;
  action: 'create' | 'modify' | 'delete';
  sessionId: string;
  timestamp: number;
}

export interface EventSessionStatus {
  type: 'session_status';
  status: SessionStatus;
  sessionId: string;
  timestamp: number;
}

export interface EventTodoUpdate {
  type: 'todo_update';
  todo: { content: string; status: string };
  sessionId: string;
  timestamp: number;
}

export interface EventCommandExecuted {
  type: 'command_executed';
  command: string;
  result: string;
  sessionId: string;
  timestamp: number;
}

export interface EventError {
  type: 'error';
  message: string;
  code?: string;
  sessionId: string;
  timestamp: number;
}

export interface EventReasoning {
  type: 'reasoning';
  text: string;
  sessionId: string;
  timestamp: number;
}

export type AgentEvent =
  | EventTextDelta
  | EventToolCall
  | EventFileEdit
  | EventSessionStatus
  | EventTodoUpdate
  | EventCommandExecuted
  | EventError
  | EventReasoning;

// ---- Sessions ----

export interface AgentSession {
  id: string;
  mode: string;
  status: SessionStatus;
  events: AgentEvent[];
  startTime: number;
  endTime?: number;
  result?: unknown;
  error?: string;
}

// ---- Config ----

export interface SidecarConfig {
  sidecarPort: number;
  wsPort: number;
  wsSecret: string;
  opencodeHost: string;
  opencodePort: number;
  careerOpsPath: string;
  logLevel: string;
  modes: ModeDefinition[];
}

// ---- API Result Wrapper ----

export interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  sessionId?: string;
}

// ---- WebSocket Messages ----

export interface WsClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'command';
  sessionId?: string;
  payload?: Record<string, unknown>;
}

export interface WsServerMessage {
  type: 'event' | 'pong' | 'error';
  event?: AgentEvent;
  message?: string;
}
