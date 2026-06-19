"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, Minus, Bot, PanelRightOpen } from "lucide-react";

interface AgentModalProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

export function AgentModal({
  isOpen,
  isMinimized,
  onClose,
  onToggleMinimize,
}: AgentModalProps) {
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
            <Bot className="w-5 h-5 text-[#FACC15]" />
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-medium text-[#E4E2DD]">Agent</span>
              <span className="text-[10px] text-[#6B6B6B]">Idle</span>
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
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
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

            {/* iframe - opencode native UI on :4196 */}
            <iframe
              src="http://localhost:4196"
              className="flex-1 min-h-0 w-full border-0"
              title="OpenCode Agent"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
