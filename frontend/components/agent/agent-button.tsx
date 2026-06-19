"use client";

import { useState, useCallback, useEffect } from "react";
import { Bot } from "lucide-react";
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

function getInitialState(): PanelState {
  if (typeof window === "undefined") return "closed";
  const saved = localStorage.getItem("agent_panel_state");
  if (saved === "open" || saved === "minimized") return saved;
  return "closed";
}

function getInitialWidth(): number {
  if (typeof window === "undefined") return 480;
  const saved = localStorage.getItem("agent_panel_width");
  const parsed = saved ? parseInt(saved, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 320 ? parsed : 480;
}

interface AgentButtonProps {
  variant?: "navbar" | "inline";
}

export function AgentButton({ variant = "navbar" }: AgentButtonProps) {
  const [panelState, setPanelState] = useState<PanelState>(getInitialState);
  const [panelWidth, setPanelWidth] = useState(getInitialWidth);
  const [modes, setModes] = useState(DEFAULT_MODES);

  // Fetch real modes from API
  useEffect(() => {
    fetch("/api/opencode/modes")
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data?.modes?.length) setModes(data.modes);
      })
      .catch(() => {});
  }, []);

  // Persist panel state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("agent_panel_state", panelState);
    }
  }, [panelState]);

  // Persist panel width to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("agent_panel_width", String(panelWidth));
    }
  }, [panelWidth]);

  const openModal = useCallback(() => {
    setPanelState("open");
  }, []);

  const toggleMinimize = useCallback(() => {
    setPanelState((prev) => (prev === "open" ? "minimized" : "open"));
  }, []);

  const closeModal = useCallback(() => {
    setPanelState("closed");
  }, []);

  const handleButtonClick = useCallback(() => {
    if (panelState === "closed") {
      openModal();
    } else {
      toggleMinimize();
    }
  }, [panelState, openModal, toggleMinimize]);

  const handleResize = useCallback((newWidth: number) => {
    setPanelWidth(newWidth);
  }, []);

  const isPanelActive = panelState !== "closed";

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
        width={panelWidth}
        onResize={handleResize}
      />
    </>
  );
}
