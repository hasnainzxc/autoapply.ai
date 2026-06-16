"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, FileText, Terminal, AlertTriangle } from "lucide-react";

interface ProgressEvent {
  type: string;
  text?: string;
  sessionId?: string;
  status?: string;
  command?: string;
  filePath?: string;
  action?: string;
  message?: string;
  toolName?: string;
  timestamp?: number;
  todo?: { content: string; status: string };
}

interface ProgressPanelProps {
  events: ProgressEvent[];
  activeSession: string | null;
}

export function ProgressPanel({ events, activeSession }: ProgressPanelProps) {
  const steps = useMemo(() => {
    return events.filter((e) => e.type === "todo_update" || e.type === "command_executed");
  }, [events]);

  const currentAction = useMemo(() => {
    const toolCalls = events.filter((e) => e.type === "tool_call");
    return toolCalls[toolCalls.length - 1] ?? null;
  }, [events]);

  const fileEdits = useMemo(() => {
    return events.filter((e) => e.type === "file_edit");
  }, [events]);

  const errors = useMemo(() => {
    return events.filter((e) => e.type === "error");
  }, [events]);

  const lastStatus = useMemo(() => {
    const statusEvents = events.filter((e) => e.type === "session_status");
    return statusEvents[statusEvents.length - 1]?.status ?? null;
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

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Status */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
        <span className="text-[#6B6B6B]">Status</span>
        <span className="flex items-center gap-1.5">
          {lastStatus === "busy" && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FACC15]" />
              <span className="text-[#FACC15]">Running</span>
            </>
          )}
          {lastStatus === "done" && (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Done</span>
            </>
          )}
          {lastStatus === "error" && (
            <>
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">Error</span>
            </>
          )}
          {(!lastStatus || lastStatus === "idle") && (
            <span className="text-[#6B6B6B]">Idle</span>
          )}
          {duration && <span className="text-[#6B6B6B] ml-2">{duration}</span>}
        </span>
      </div>

      {/* Active session */}
      {activeSession && (
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[#6B6B6B] text-xs">Session</span>
          <p className="text-[#E4E2DD] text-xs font-mono truncate">{activeSession}</p>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[#6B6B6B] text-xs mb-1 block">Steps</span>
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                <span className="text-[#E4E2DD] text-xs">
                  {step.todo?.content ?? step.command ?? "Step completed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Action */}
      {currentAction && (
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[#6B6B6B] text-xs mb-1 block">
            <Terminal className="w-3 h-3 inline mr-1" />
            Current Action
          </span>
          <p className="text-[#FACC15] text-xs truncate">{currentAction.toolName}</p>
        </div>
      )}

      {/* File Edits */}
      {fileEdits.length > 0 && (
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-[#6B6B6B] text-xs mb-1 block">
            <FileText className="w-3 h-3 inline mr-1" />
            Files Changed ({fileEdits.length})
          </span>
          <div className="space-y-0.5">
            {fileEdits.slice(-3).map((fe, i) => (
              <p key={i} className="text-[#E4E2DD] text-xs truncate">
                {fe.action === "create" ? "+" : fe.action === "delete" ? "-" : "~"} {fe.filePath}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="text-red-400 text-xs mb-1 block">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Errors ({errors.length})
          </span>
          {errors.slice(-2).map((err, i) => (
            <p key={i} className="text-red-300 text-xs">{err.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
