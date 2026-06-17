"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AgentEvent {
  type: string;
  text?: string;
  sessionId?: string;
  timestamp?: number;
  status?: string;
  command?: string;
  result?: string;
  toolName?: string;
  message?: string;
}

interface UseAgentStreamReturn {
  connect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: object) => void;
  events: AgentEvent[];
  sessions: string[];
  activeSession: string | null;
  error: string | null;
  isConnected: boolean;
}

const MAX_EVENTS = 500;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/opencode/ws";

export function useAgentStream(): UseAgentStreamReturn {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  const MAX_RECONNECT_DELAY = 30000;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "event" && data.event) {
            const evt = data.event;
            setEvents((prev) => {
              const next = [...prev, evt];
              return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
            });
            if (evt.sessionId) {
              setSessions((prev) =>
                prev.includes(evt.sessionId) ? prev : [...prev, evt.sessionId]
              );
              if (evt.type === "session_status" && evt.status === "busy") {
                setActiveSession(evt.sessionId);
              }
            }
          } else if (data.type === "pong") {
            // heartbeat ok
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        setIsConnected(false);
        scheduleReconnect();
      };

      wsRef.current = ws;
    } catch (err) {
      setError("Failed to create WebSocket");
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError("Connection failed after max retries");
      return;
    }
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    );
    reconnectAttemptsRef.current += 1;

    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = 999; // prevent reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setError(null);
  }, []);

  const sendCommand = useCallback((cmd: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendCommand,
    events,
    sessions,
    activeSession,
    error,
    isConnected,
  };
}
