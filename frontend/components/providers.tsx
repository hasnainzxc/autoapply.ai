"use client";

import type { ReactNode } from "react";
import { AgentProvider } from "@/contexts/agent-context";

export function Providers({ children }: { children: ReactNode }) {
  return <AgentProvider>{children}</AgentProvider>;
}
