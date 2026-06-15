"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAgentStream } from "@/hooks/use-agent-stream";

interface AgentContextValue {
  connect: () => void;
  disconnect: () => void;
  sendCommand: (cmd: object) => void;
  events: any[];
  sessions: string[];
  activeSession: string | null;
  error: string | null;
  isConnected: boolean;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const stream = useAgentStream();

  return (
    <AgentContext.Provider value={stream}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}
