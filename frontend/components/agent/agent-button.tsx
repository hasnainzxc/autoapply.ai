"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { useAgent } from "@/contexts/agent-context";
import { AgentModal } from "./agent-modal";
import { ModeLauncher } from "./mode-launcher";

interface AgentButtonProps {
  variant?: "navbar" | "inline";
}

export function AgentButton({ variant = "navbar" }: AgentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [launchMode, setLaunchMode] = useState<string>("scan");
  const [launchArgs, setLaunchArgs] = useState<Record<string, unknown>>({});
  const { connect, disconnect, events, activeSession, isConnected, sendCommand } = useAgent();

  const openModal = () => {
    connect();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    disconnect();
  };

  const handleLaunch = (mode: string, args: Record<string, unknown>) => {
    setLaunchMode(mode);
    setLaunchArgs(args);
    openModal();
  };

  const handleAbort = () => {
    sendCommand({ type: "command", payload: { action: "abort" } });
  };

  if (variant === "navbar") {
    return (
      <>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm text-[#E4E2DD] transition-all min-h-[44px]"
        >
          <Bot className={`w-4 h-4 ${isConnected ? "text-[#FACC15]" : "text-[#6B6B6B]"}`} />
          <span>Agent</span>
          {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
        </button>
        <AgentModal
          isOpen={isModalOpen}
          onClose={closeModal}
          mode={launchMode}
          events={events}
          activeSession={activeSession}
          onAbort={handleAbort}
        />
      </>
    );
  }

  // inline variant with ModeLauncher
  return (
    <>
      <ModeLauncher isConnected={isConnected} onLaunch={handleLaunch} />
      <AgentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={launchMode}
        events={events}
        activeSession={activeSession}
        onAbort={handleAbort}
      />
    </>
  );
}
