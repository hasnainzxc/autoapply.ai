"use client";

import { useState, useCallback, useEffect } from "react";
import { Bot } from "lucide-react";
import { useAgent } from "@/contexts/agent-context";
import { AgentModal } from "./agent-modal";

const DEFAULT_MODES = [
  { id: "career-ops-scan", name: "scan", command: "career-ops-scan", description: "Scan job portals" },
  { id: "career-ops-evaluate", name: "evaluate", command: "career-ops-evaluate", description: "Evaluate job offer" },
  { id: "career-ops-apply", name: "apply", command: "career-ops-apply", description: "Live application assistant" },
  { id: "career-ops-pdf", name: "pdf", command: "career-ops-pdf", description: "Generate CV PDF" },
  { id: "career-ops-pipeline", name: "pipeline", command: "career-ops-pipeline", description: "Process pipeline" },
  { id: "career-ops-compare", name: "compare", command: "career-ops-compare", description: "Compare job offers" },
  { id: "career-ops-contact", name: "contact", command: "career-ops-contact", description: "LinkedIn outreach" },
  { id: "career-ops-batch", name: "batch", command: "career-ops-batch", description: "Batch processing" },
  { id: "career-ops-tracker", name: "tracker", command: "career-ops-tracker", description: "Application tracker" },
  { id: "career-ops-dashboard", name: "dashboard", command: "career-ops-dashboard", description: "Job tracker dashboard" },
  { id: "career-ops-gmail", name: "gmail", command: "career-ops-gmail", description: "Track email responses" },
  { id: "career-ops-interview-prep", name: "interview-prep", command: "career-ops-interview-prep", description: "Interview preparation" },
  { id: "career-ops-patterns", name: "patterns", command: "career-ops-patterns", description: "Analyze patterns" },
  { id: "career-ops-followup", name: "followup", command: "career-ops-followup", description: "Schedule follow-ups" },
  { id: "career-ops-latex", name: "latex", command: "career-ops-latex", description: "Generate LaTeX CV" },
];

type PanelState = "closed" | "open" | "minimized";

interface AgentButtonProps {
  variant?: "navbar" | "inline";
}

export function AgentButton({ variant = "navbar" }: AgentButtonProps) {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [modes, setModes] = useState(DEFAULT_MODES);
  const { connect, disconnect, events, activeSession, isConnected, sendCommand } = useAgent();

  // Fetch real modes from API
  useEffect(() => {
    fetch("/api/opencode/modes")
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data?.modes?.length) setModes(data.modes);
      })
      .catch(() => {});
  }, []);

  const openModal = useCallback(() => {
    connect();
    setPanelState("open");
  }, [connect]);

  const toggleMinimize = useCallback(() => {
    setPanelState((prev) => (prev === "open" ? "minimized" : "open"));
  }, []);

  const closeModal = useCallback(() => {
    setPanelState("closed");
    disconnect();
  }, [disconnect]);

  const handleButtonClick = useCallback(() => {
    if (panelState === "closed") {
      openModal();
    } else {
      toggleMinimize();
    }
  }, [panelState, openModal, toggleMinimize]);

  const handleCommand = useCallback(
    async (command: string) => {
      connect();

      const trimmed = command.trim();
      if (!trimmed) return;

      // Slash command → trigger mode via HTTP
      if (trimmed.startsWith("/")) {
        const mode = trimmed.slice(1).split(" ")[0];
        if (!mode) return;
        try {
          const res = await fetch("/api/opencode/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode, args: {} }),
          });
          if (!res.ok) {
            console.error("trigger failed:", res.status, await res.text());
          }
        } catch (e) {
          console.error("trigger error:", e);
        }
        return;
      }

      // Plain text → send via WebSocket as chat
      sendCommand({ type: "chat", text: trimmed });
    },
    [connect, sendCommand]
  );

  const handleAbort = useCallback(async () => {
    if (!activeSession) return;
    try {
      await fetch(`/api/opencode/sessions/${activeSession}/abort`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  }, [activeSession]);

  const isPanelActive = panelState !== "closed";

  // Auto-connect for inline variant
  useEffect(() => {
    if (variant === "inline") connect();
  }, [variant, connect]);

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all min-h-[44px] ${
          isPanelActive
            ? "bg-[#FACC15]/15 border border-[#FACC15]/40 text-[#FACC15] shadow-sm shadow-[#FACC15]/5"
            : "bg-white/[0.06] border border-white/[0.12] text-[#E4E2DD] hover:bg-white/[0.12] hover:border-white/[0.2]"
        }`}
        title={
          panelState === "closed"
            ? "Open Agent"
            : panelState === "minimized"
            ? "Restore Agent"
            : "Minimize Agent"
        }
      >
        <Bot
          className={`w-4 h-4 transition-transform ${
            isPanelActive ? "scale-110" : ""
          }`}
        />
        <span>Agent</span>
        {isPanelActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>
      <AgentModal
        isOpen={panelState === "open"}
        isMinimized={panelState === "minimized"}
        onClose={closeModal}
        onToggleMinimize={toggleMinimize}
        mode=""
        events={events}
        activeSession={activeSession}
        onAbort={handleAbort}
        onCommand={handleCommand}
        modes={modes}
        isConnected={isConnected}
      />
    </>
  );
}
