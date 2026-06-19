"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAgentStream } from "@/hooks/use-agent-stream";

interface AgentContextValue {
  connect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: object) => void;
  registerSession: (sessionId: string) => void;
  events: any[];
  sessions: string[];
  activeSession: string | null;
  error: string | null;
  isConnected: boolean;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const stream = useAgentStream();

  const value = useMemo(() => ({
    connect: stream.connect,
    disconnect: stream.disconnect,
    sendCommand: stream.sendCommand,
    registerSession: stream.registerSession,
    events: stream.events,
    sessions: stream.sessions,
    activeSession: stream.activeSession,
    error: stream.error,
    isConnected: stream.isConnected,
  }), [
    stream.connect,
    stream.disconnect,
    stream.sendCommand,
    stream.registerSession,
    stream.events,
    stream.sessions,
    stream.activeSession,
    stream.error,
    stream.isConnected,
  ]);

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}
