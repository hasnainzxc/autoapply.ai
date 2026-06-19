"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, Minus, Bot, PanelRightOpen } from "lucide-react";

interface AgentModalProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  width?: number;
  onResize?: (width: number) => void;
}

export function AgentModal({
  isOpen,
  isMinimized,
  onClose,
  onToggleMinimize,
  width = 480,
  onResize,
}: AgentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      const clamped = Math.max(320, Math.min(newWidth, window.innerWidth * 0.9));
      if (panelRef.current) {
        panelRef.current.style.width = `${clamped}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const finalWidth = Math.max(320, Math.min(e.clientX, window.innerWidth * 0.9));
      onResize?.(finalWidth);
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onResize]);

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
            className="fixed left-0 top-1/3 z-[60] flex items-center gap-2 px-2.5 py-3 rounded-r-xl bg-[#121212] border border-l-0 border-white/10 hover:bg-[#1A1A1A] transition-all duration-200 cursor-pointer group"
            style={{
              boxShadow: "0 4px 20px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
            title="Restore Agent Panel"
          >
            <div
              className="p-1 rounded-md"
              style={{
                background: "rgba(250,204,21,0.08)",
                boxShadow: "0 0 8px -2px rgba(250,204,21,0.2)",
              }}
            >
              <Bot className="w-5 h-5 text-[#FACC15]" style={{ filter: "drop-shadow(0 0 3px rgba(250,204,21,0.3))" }} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-xs font-medium text-[#E4E2DD]">Agent</span>
              <span className="text-[10px] text-[#6B6B6B]">Idle</span>
            </div>
            <PanelRightOpen className="w-3.5 h-3.5 text-[#6B6B6B] group-hover:text-[#FACC15] transition-all duration-200 ml-1 group-hover:drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]" />
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
            onClick={onToggleMinimize}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="side-panel"
            ref={panelRef}
            initial={{ x: -480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -480, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-[60] max-w-[95vw] bg-[#0A0A0A] border-r border-white/10 flex flex-col overflow-hidden"
            style={{
              width: `${width}px`,
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px -15px rgba(0,0,0,0.6), 0 8px 24px -8px rgba(0,0,0,0.4)",
            }}
          >
            {/* Resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[3px] cursor-col-resize hover:w-[5px] bg-white/0 hover:bg-white/10 transition-all duration-150 group z-20"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute inset-y-0 right-0 w-[8px] -mr-[4px]" />
            </div>

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FACC15]/60 to-transparent z-10" />

            {/* Edge fade overlays */}
            <div className="pointer-events-none absolute top-[1px] left-0 right-0 h-8 bg-gradient-to-b from-[#0A0A0A]/80 to-transparent z-10" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10" />

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0 relative z-20"
              style={{
                background: "linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.85) 100%)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="p-1.5 rounded-lg relative"
                  style={{
                    background: "rgba(250,204,21,0.08)",
                    boxShadow: "0 0 12px -2px rgba(250,204,21,0.25), inset 0 0 8px rgba(250,204,21,0.05)",
                  }}
                >
                  <Terminal className="w-4 h-4 text-[#FACC15]" style={{ filter: "drop-shadow(0 0 4px rgba(250,204,21,0.4))" }} />
                </div>
                <span className="text-[#E4E2DD] font-medium truncate text-sm">Career-Ops Agent</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onToggleMinimize}
                  className="p-1.5 rounded-lg text-[#6B6B6B] transition-all duration-200 hover:text-[#E4E2DD] active:scale-95 hover:bg-white/[0.08] hover:shadow-[0_0_8px_rgba(255,255,255,0.04)]"
                  title="Minimize"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#6B6B6B] transition-all duration-200 hover:text-[#EF4444] active:scale-95 hover:bg-red-400/[0.1] hover:shadow-[0_0_8px_rgba(239,68,68,0.08)]"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* iframe - opencode native UI on :4196 */}
            {/* No sandbox: localhost sidecar is trusted. allow-scripts+allow-same-origin
                would effectively disable sandbox per spec, so explicit no-sandbox is
                clearer about the trust boundary. */}
            <iframe
              src="http://localhost:4196"
              className={`flex-1 min-h-0 w-full border-0 relative z-0 ${isResizing ? "pointer-events-none" : ""}`}
              title="OpenCode Agent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
