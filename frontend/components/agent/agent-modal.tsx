"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, OctagonX, Terminal, Loader2, Minus, Bot, PanelRightOpen } from "lucide-react";
import { AgentChat } from "./agent-chat";

interface AgentModalProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  mode: string;
  events: any[];
  activeSession: string | null;
  onAbort: () => void;
  onCommand: (command: string) => void;
  modes: Array<{ id: string; name: string; command: string; description: string }>;
  isConnected: boolean;
}

export function AgentModal({
  isOpen,
  isMinimized,
  onClose,
  onToggleMinimize,
  mode,
  events,
  activeSession,
  onAbort,
  onCommand,
  modes,
  isConnected,
}: AgentModalProps) {
  const status = useMemo(() => {
    const statusEvents = events.filter((e) => e.type === "session_status");
    return statusEvents[statusEvents.length - 1]?.status ?? "idle";
  }, [events]);

  const isBusy = status === "busy";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Floating minimized badge */}
      <AnimatePresence>
        {isMinimized && (
          <motion.button
            key="minimized-badge"
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={onToggleMinimize}
            className="fixed left-0 top-1/3 z-[60] flex items-center gap-2 px-2.5 py-3 rounded-r-xl bg-[#121212] border border-l-0 border-white/10 shadow-2xl hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
            title="Restore Agent Panel"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-[#FACC15]" />
              {isBusy && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse ring-2 ring-[#121212]" />
              )}
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-medium text-[#E4E2DD]">Agent</span>
              <span className="text-[10px] text-[#6B6B6B]">
                {isBusy ? "Running" : status === "done" ? "Done" : "Idle"}
              </span>
            </div>
            <PanelRightOpen className="w-3.5 h-3.5 text-[#6B6B6B] group-hover:text-[#FACC15] transition-colors ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="side-panel"
            initial={{ x: -480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -480, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-[60] w-[480px] max-w-[95vw] bg-[#0A0A0A] border-r border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121212] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#FACC15]/10">
                  <Terminal className="w-4 h-4 text-[#FACC15]" />
                </div>
                <span className="text-[#E4E2DD] font-medium truncate text-sm">Career-Ops Agent</span>
                <div className="flex items-center gap-1 text-xs shrink-0">
                  {isBusy && (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#FACC15]" />
                      <span className="text-[#FACC15]">Running</span>
                    </>
                  )}
                  {status === "done" && <span className="text-green-400">Completed</span>}
                  {status === "error" && <span className="text-red-400">Failed</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isBusy && (
                  <button
                    onClick={onAbort}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs transition-colors"
                    title="Abort"
                  >
                    <OctagonX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Abort</span>
                  </button>
                )}
                <button
                  onClick={onToggleMinimize}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-[#6B6B6B] hover:text-[#E4E2DD] transition-colors"
                  title="Minimize"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-[#6B6B6B] hover:text-[#E4E2DD] transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat body */}
            <AgentChat
              events={events}
              activeSession={activeSession}
              onSend={onCommand}
              modes={modes}
              isConnected={isConnected}
              isBusy={isBusy}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
