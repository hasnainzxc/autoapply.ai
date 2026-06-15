"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, OctagonX, Terminal, Loader2 } from "lucide-react";
import { XtermTerminal, type XtermTerminalHandle } from "./xterm-terminal";
import { ProgressPanel } from "./progress-panel";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: string;
  events: any[];
  activeSession: string | null;
  onAbort: () => void;
}

export function AgentModal({
  isOpen,
  onClose,
  mode,
  events,
  activeSession,
  onAbort,
}: AgentModalProps) {
  const terminalRef = useRef<XtermTerminalHandle>(null);

  const status = useMemo(() => {
    const statusEvents = events.filter((e) => e.type === "session_status");
    return statusEvents[statusEvents.length - 1]?.status ?? "idle";
  }, [events]);

  const duration = useMemo(() => {
    if (events.length < 2) return null;
    const first = events[0]?.timestamp ?? 0;
    const last = events[events.length - 1]?.timestamp ?? 0;
    if (!first || !last) return null;
    const secs = Math.round((last - first) / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }, [events]);

  useEffect(() => {
    if (!terminalRef.current) return;
    const textEvents = events.filter(
      (e) => e.type === "text_delta" && e.text
    );
    if (textEvents.length > 0) {
      const last = textEvents[textEvents.length - 1];
      terminalRef.current.write(last.text + "\r\n");
    }
  }, [events]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen && terminalRef.current) {
      terminalRef.current.write(
        `\x1b[33mStarting ${mode} mode...\x1b[0m\r\n`
      );
    }
  }, [isOpen, mode]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[90vw] h-[85vh] max-w-6xl bg-[#0A0A0A] rounded-2xl border border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-[#FACC15]" />
                <span className="text-[#E4E2DD] font-medium capitalize">{mode}</span>
                <span className="flex items-center gap-1 text-xs">
                  {status === "busy" && (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#FACC15]" />
                      <span className="text-[#FACC15]">Running</span>
                    </>
                  )}
                  {status === "done" && (
                    <span className="text-green-400">Completed</span>
                  )}
                  {status === "error" && (
                    <span className="text-red-400">Failed</span>
                  )}
                </span>
                {duration && (
                  <span className="text-[#6B6B6B] text-xs">{duration}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {status === "busy" && (
                  <button
                    onClick={onAbort}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
                  >
                    <OctagonX className="w-3.5 h-3.5" />
                    Abort
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#6B6B6B] hover:text-[#E4E2DD] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Terminal (60%) */}
              <div className="w-3/5 border-r border-white/10">
                <XtermTerminal ref={terminalRef} className="h-full rounded-none" />
              </div>

              {/* Progress Panel (40%) */}
              <div className="w-2/5 overflow-y-auto p-4">
                <ProgressPanel events={events} activeSession={activeSession} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2 border-t border-white/10 bg-white/5 flex items-center gap-4 text-xs text-[#6B6B6B]">
              <span>Mode: {mode}</span>
              {activeSession && <span>Session: {activeSession.slice(0, 12)}...</span>}
              <span>Events: {events.length}</span>
              {duration && <span>Duration: {duration}</span>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
