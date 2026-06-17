"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Terminal,
  Loader2,
  ChevronRight,
  ChevronDown,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Search,
  Globe,
  FileText,
  Sparkles,
  Slash,
  Wrench,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolCallInfo {
  id: string;
  name: string;
  status: "running" | "done";
  result?: string;
}

interface SessionStream {
  sessionId: string;
  text: string;
  tools: ToolCallInfo[];
  commandResult?: { command: string; result: string };
  todoItems: string[];
  status: "streaming" | "done" | "error";
  errorMsg?: string;
  timestamp: number;
  reasoningActive?: boolean;
  reasoningText?: string;
}

type StepItemType = 'thinking' | 'exploring' | 'loading' | 'error' | 'success' | 'info' | 'text';

interface StepItem {
  type: StepItemType;
  content: string;
  suggestion?: string;
}

interface UserMessage {
  id: string;
  role: "user";
  content: string;
  timestamp: number;
}

interface AgentChatProps {
  events: any[];
  activeSession: string | null;
  onSend: (command: string) => void;
  modes: Array<{ id: string; name: string; command: string; description: string }>;
  isConnected: boolean;
  isBusy: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ToolIcon({ name }: { name?: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    search: <Search className="w-3.5 h-3.5" />,
    webgetch: <Globe className="w-3.5 h-3.5" />,
    fetch: <Globe className="w-3.5 h-3.5" />,
    read: <FileText className="w-3.5 h-3.5" />,
    think: <Sparkles className="w-3.5 h-3.5" />,
    write: <FileText className="w-3.5 h-3.5" />,
    edit: <FileText className="w-3.5 h-3.5" />,
    bash: <Terminal className="w-3.5 h-3.5" />,
    command: <Terminal className="w-3.5 h-3.5" />,
    tectonic: <Terminal className="w-3.5 h-3.5" />,
    glob: <Search className="w-3.5 h-3.5" />,
    grep: <Search className="w-3.5 h-3.5" />,
  };
  if (!name) return <Terminal className="w-3.5 h-3.5" />;
  const key = Object.keys(iconMap).find((k) => name.toLowerCase().includes(k));
  return key ? iconMap[key] : <Wrench className="w-3.5 h-3.5" />;
}

/** Overlap-based dedup for text_delta events carrying full text */
function dedupAppend(current: string, delta: string): string {
  const maxCheck = Math.min(current.length, delta.length);
  for (let i = maxCheck; i >= 1; i--) {
    if (current.slice(-i) === delta.slice(0, i)) {
      return delta.slice(i);
    }
  }
  return delta;
}

function StatusBadge({ status, errorMsg }: { status: SessionStream["status"]; errorMsg?: string }) {
  if (status === "streaming") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[#FACC15]/80 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse" />
        Running
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-green-400/80 font-mono">
        <CheckCircle2 className="w-2.5 h-2.5" />
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-red-400/80 font-mono" title={errorMsg}>
      <AlertCircle className="w-2.5 h-2.5" />
      Error
    </span>
  );
}

// ─── Step Parsing ────────────────────────────────────────────────────────────

function parseSteps(text: string): StepItem[] {
  const lines = text.split('\n');
  const steps: StepItem[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      steps.push({ type: 'text', content: line });
      i++;
      continue;
    }

    const lower = trimmed.toLowerCase();

    if (lower.startsWith('thinking')) {
      steps.push({ type: 'thinking', content: line });
      i++;
    } else if (lower.startsWith('explored') || lower.startsWith('searching') || lower.startsWith('reading')) {
      steps.push({ type: 'exploring', content: line });
      i++;
    } else if (lower.includes('loaded')) {
      steps.push({ type: 'loading', content: line });
      i++;
    } else if (lower.includes('completed') || lower.includes('done')) {
      steps.push({ type: 'success', content: line });
      i++;
    } else if (lower.startsWith('error:')) {
      let suggestion = '';
      let j = i + 1;
      while (j < lines.length) {
        const nt = lines[j].trim();
        if (!nt) { j++; continue; }
        const nl = nt.toLowerCase();
        if (
          !nl.startsWith('thinking') && !nl.startsWith('explored') &&
          !nl.startsWith('searching') && !nl.startsWith('reading') &&
          !nl.includes('loaded') && !nl.includes('completed') && !nl.includes('done') &&
          !nl.startsWith('error:') && !nl.startsWith('$') && !nl.startsWith('|')
        ) {
          suggestion += (suggestion ? '\n' : '') + lines[j];
          j++;
        } else {
          break;
        }
      }
      steps.push({ type: 'error', content: line, suggestion: suggestion || undefined });
      i = j;
    } else if (lower.startsWith('$') || lower.startsWith('|')) {
      steps.push({ type: 'info', content: line });
      i++;
    } else {
      steps.push({ type: 'text', content: line });
      i++;
    }
  }

  return steps;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentChat({
  events,
  activeSession,
  onSend,
  modes,
  isConnected,
  isBusy,
}: AgentChatProps) {
  // Session-grouped stream state (one per sessionId)
  const [streams, setStreams] = useState<Map<string, SessionStream>>(new Map());
  // User messages stored separately
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  // Which session streams have tools expanded
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const [input, setInput] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastProcessedIdxRef = useRef(0);
  const prevDisplayLenRef = useRef(0);

  // ─── Event → Stream Processing ─────────────────────────────────────────────

  useEffect(() => {
    const fromIdx = lastProcessedIdxRef.current;
    if (events.length <= fromIdx) return;

    const newEvents = events.slice(fromIdx);
    lastProcessedIdxRef.current = events.length;

    setStreams((prev) => {
      const next = new Map(prev);

      for (const evt of newEvents) {
        const sid = evt.sessionId || "default";

        if (evt.type === "session_status") {
          if (evt.status === "busy") {
            const existing = next.get(sid);
            if (!existing || existing.status === "done" || existing.status === "error") {
              // Fresh stream for this session
              next.set(sid, {
                sessionId: sid,
                text: "",
                tools: [],
                todoItems: [],
                status: "streaming",
                timestamp: evt.timestamp || Date.now(),
              });
            } else {
              // Ensure status is streaming
              next.set(sid, { ...existing, status: "streaming", reasoningActive: false });
            }
          } else if (evt.status === "done") {
            const existing = next.get(sid);
            if (existing) {
              next.set(sid, { ...existing, status: "done", reasoningActive: false });
            }
          } else if (evt.status === "error") {
            const existing = next.get(sid);
            if (existing) {
              next.set(sid, { ...existing, status: "error", errorMsg: evt.message || "Unknown error", reasoningActive: false });
            } else {
              next.set(sid, {
                sessionId: sid,
                text: "",
                tools: [],
                todoItems: [],
                status: "error",
                errorMsg: evt.message || "Unknown error",
                timestamp: evt.timestamp || Date.now(),
              });
            }
          }
        } else if (evt.type === "text_delta" && evt.text) {
          const existing = next.get(sid);
          if (existing) {
            const deduped = dedupAppend(existing.text, evt.text);
            if (deduped) {
              next.set(sid, { ...existing, reasoningActive: false, text: existing.text + deduped });
            }
          } else {
            // Text arrives before session_status/busy
            next.set(sid, {
              sessionId: sid,
              text: evt.text,
              tools: [],
              todoItems: [],
              status: "streaming",
              timestamp: evt.timestamp || Date.now(),
            });
          }
        } else if (evt.type === "tool_call") {
          const tool: ToolCallInfo = {
            id: evt.toolName ? `${sid}-${evt.toolName}` : `tool-${next.size}-${Date.now()}`,
            name: evt.toolName || evt.description || "tool",
            status: "running",
          };
          const existing = next.get(sid);
          if (existing) {
            next.set(sid, { ...existing, tools: [...existing.tools, tool] });
          } else {
            next.set(sid, {
              sessionId: sid,
              text: "",
              tools: [tool],
              todoItems: [],
              status: "streaming",
              timestamp: evt.timestamp || Date.now(),
            });
          }
        } else if (evt.type === "tool_result") {
          const existing = next.get(sid);
          if (existing) {
            const tools = existing.tools.map((t) =>
              t.status === "running" && (t.name === evt.toolName)
                ? { ...t, status: "done" as const, result: evt.result }
                : t
            );
            // If no name match, mark last running tool
            const stillRunning = tools.some((t) => t.status === "running" && t.name === evt.toolName);
            const updatedTools = stillRunning
              ? tools
              : (() => {
                  const idx = tools.findIndex((t) => t.status === "running");
                  if (idx >= 0) {
                    const copy = [...tools];
                    copy[idx] = { ...copy[idx], status: "done" as const, result: evt.result };
                    return copy;
                  }
                  return tools;
                })();
            next.set(sid, { ...existing, tools: updatedTools });
          }
        } else if (evt.type === "command_executed") {
          const result =
            evt.result
              ? typeof evt.result === "string"
                ? evt.result
                : JSON.stringify(evt.result, null, 2)
              : "";
          const existing = next.get(sid);
          if (existing) {
            next.set(sid, {
              ...existing,
              commandResult: { command: evt.command || "", result },
            });
          } else {
            next.set(sid, {
              sessionId: sid,
              text: "",
              tools: [],
              todoItems: [],
              commandResult: { command: evt.command || "", result },
              status: "streaming",
              timestamp: evt.timestamp || Date.now(),
            });
          }
        } else if (evt.type === "todo_update") {
          const todoItem = evt.todo?.content || "Task";
          const done = evt.todo?.status === "completed" || evt.todo?.status === "done";
          const formatted = `${done ? "☑" : "☐"} ${todoItem}`;
          const existing = next.get(sid);
          if (existing) {
            next.set(sid, {
              ...existing,
              todoItems: [...existing.todoItems, formatted],
            });
          } else {
            next.set(sid, {
              sessionId: sid,
              text: "",
              tools: [],
              todoItems: [formatted],
              status: "streaming",
              timestamp: evt.timestamp || Date.now(),
            });
          }
        } else if (evt.type === "reasoning") {
          const existing = next.get(sid);
          if (existing) {
            next.set(sid, { ...existing, reasoningActive: true, reasoningText: evt.text || 'Thinking...' });
          } else {
            next.set(sid, {
              sessionId: sid,
              text: "",
              tools: [],
              todoItems: [],
              status: "streaming",
              reasoningActive: true,
              reasoningText: evt.text || 'Thinking...',
              timestamp: evt.timestamp || Date.now(),
            });
          }
        } else if (evt.type === "error") {
          const errMsg = evt.message || evt.text || "An error occurred";
          const existing = next.get(sid);
          if (existing) {
            next.set(sid, { ...existing, status: "error", errorMsg: errMsg });
          } else {
            next.set(sid, {
              sessionId: sid,
              text: "",
              tools: [],
              todoItems: [],
              status: "error",
              errorMsg: errMsg,
              timestamp: evt.timestamp || Date.now(),
            });
          }
        }
      }

      return next;
    });
  }, [events]);

  // ─── Fallback: mark streams done when isBusy goes false ────────────────────
  useEffect(() => {
    if (!isBusy) {
      setStreams((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [sid, s] of next) {
          if (s.status === "streaming") {
            next.set(sid, { ...s, status: "done" });
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [isBusy]);

  // ─── Build display list (user messages + streams, ordered by time) ────────
  const displayItems = useMemo<(UserMessage | SessionStream)[]>(() => {
    const streamList = Array.from(streams.values())
      .filter(
        (s) =>
          s.text ||
          s.tools.length > 0 ||
          s.commandResult ||
          s.todoItems.length > 0 ||
          s.status === "error"
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    // Interleave by timestamp
    const merged: (UserMessage | SessionStream)[] = [];
    let ui = 0;
    let si = 0;
    while (ui < userMessages.length || si < streamList.length) {
      if (si >= streamList.length) {
        merged.push(userMessages[ui]);
        ui++;
      } else if (ui >= userMessages.length) {
        merged.push(streamList[si]);
        si++;
      } else if (userMessages[ui].timestamp <= streamList[si].timestamp) {
        merged.push(userMessages[ui]);
        ui++;
      } else {
        merged.push(streamList[si]);
        si++;
      }
    }
    return merged;
  }, [streams, userMessages]);

  // ─── Auto-scroll on new display items (not on every text_delta) ────────────
  useEffect(() => {
    if (displayItems.length !== prevDisplayLenRef.current) {
      prevDisplayLenRef.current = displayItems.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayItems]);

  // ─── Autocomplete filtering ──────────────────────────────────────────────
  const filteredModes = input.startsWith("/")
    ? modes.filter((m) =>
        m.command.toLowerCase().includes(input.slice(1).toLowerCase())
      )
    : [];

  // ─── Send handler ───────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;

    setUserMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: trimmed, timestamp: Date.now() },
    ]);

    onSend(trimmed);
    setInput("");
    setShowAutocomplete(false);
  }, [input, isConnected, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showAutocomplete && filteredModes.length > 0) {
        // Select autocomplete AND send immediately
        const mode = filteredModes[autocompleteIndex];
        if (mode) {
          setInput(`/${mode.command} `);
          setShowAutocomplete(false);
          const cmd = `/${mode.command}`;
          setUserMessages((prev) => [
            ...prev,
            { id: `user-${Date.now()}`, role: "user", content: cmd, timestamp: Date.now() },
          ]);
          onSend(cmd);
        }
      } else {
        handleSend();
      }
    } else if (e.key === "ArrowDown" && showAutocomplete) {
      e.preventDefault();
      setAutocompleteIndex((prev) => Math.min(prev + 1, filteredModes.length - 1));
    } else if (e.key === "ArrowUp" && showAutocomplete) {
      e.preventDefault();
      setAutocompleteIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setShowAutocomplete(false);
    }
  };

  const selectAutocomplete = (idx: number) => {
    const mode = filteredModes[idx];
    if (!mode) return;
    setInput(`/${mode.command} `);
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  // ─── Render helpers ────────────────────────────────────────────────────

  const toggleToolsExpand = (sessionId: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  /** Render a typed step item with appropriate icon and color */
  const renderTypedStep = (step: StepItem, idx: number) => {
    switch (step.type) {
      case 'thinking':
        return (
          <div key={idx} className="flex items-start gap-1.5 text-[#FACC15]/60 text-xs leading-relaxed">
            <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-[#FACC15] animate-thinking-pulse" />
            <span className="flex-1">{step.content}</span>
            <span className="w-1 h-1 rounded-full bg-[#FACC15] animate-thinking-pulse shrink-0 mt-1.5" />
          </div>
        );
      case 'exploring':
        return (
          <div key={idx} className="flex items-start gap-1.5 text-[#60A5FA]/80 text-xs leading-relaxed pl-2">
            <Search className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="flex-1">{step.content}</span>
          </div>
        );
      case 'loading':
        return (
          <div key={idx} className="flex items-start gap-1.5 text-[#4ADE80]/80 text-xs leading-relaxed">
            <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-[#4ADE80]" />
            <span className="flex-1 font-medium">{step.content}</span>
          </div>
        );
      case 'success':
        return (
          <div key={idx} className="flex items-start gap-1.5 text-[#4ADE80]/80 text-xs leading-relaxed">
            <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-[#4ADE80]" />
            <span className="flex-1">{step.content}</span>
          </div>
        );
      case 'error':
        return (
          <div key={idx} className="mt-1">
            <div className="flex items-start gap-1.5 text-xs leading-relaxed text-red-400 font-mono border-l-2 border-red-400/30 pl-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
              <span className="flex-1">{step.content}</span>
            </div>
            {step.suggestion && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                className="mt-0.5 ml-5 text-[11px] text-red-400/60 italic border-l-2 border-red-400/20 pl-2 leading-relaxed"
              >
                {step.suggestion}
              </motion.div>
            )}
          </div>
        );
      case 'info':
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs leading-relaxed text-green-400/80 font-mono">
            <Terminal className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="flex-1">{step.content}</span>
          </div>
        );
      default:
        return (
          <div key={idx} className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-[#E4E2DD]">
            {step.content}
          </div>
        );
    }
  };

  /** Render a single SessionStream as a unified message bubble */
  const renderSessionStream = (stream: SessionStream) => (
    <motion.div
      key={stream.sessionId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2 justify-start"
    >
      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-[#FACC15]/10 flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[#FACC15]" />
      </div>

      {/* Bubble */}
      <div className="max-w-[85%] rounded-xl px-3.5 py-2 bg-white/5 border border-white/10 text-[#E4E2DD]">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[#FACC15]/80">Agent</span>
          <StatusBadge status={stream.status} errorMsg={stream.errorMsg} />
          <span className="text-[10px] text-[#6B6B6B]/60 ml-auto">
            {formatTime(stream.timestamp)}
          </span>
        </div>

        {/* Reasoning indicator */}
        {stream.reasoningActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-[#FACC15]/80 text-xs font-mono mt-1 mb-1 overflow-hidden"
          >
            <Sparkles className="w-3 h-3 text-[#FACC15] animate-thinking-pulse shrink-0" />
            <span className="animate-thinking-shimmer rounded px-1">{stream.reasoningText || 'Thinking...'}</span>
          </motion.div>
        )}

        {/* Text content with step-parsed visual distinction */}
        {stream.text && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono mt-1">
            {(() => {
              const steps = parseSteps(stream.text);
              let pipeIdx = 0;
              return steps.map((step, i) => {
                // Handle pipe-delimited tables with alternating rows
                if (step.type === 'info' && step.content.trimStart().startsWith('|')) {
                  const pIdx = pipeIdx++;
                  const isOdd = pIdx % 2 === 1;
                  return (
                    <div key={i} className={`text-xs leading-relaxed font-mono text-[#E4E2DD] ${isOdd ? 'bg-white/5 rounded px-1 -mx-1' : ''}`}>
                      {step.content}
                    </div>
                  );
                }
                // Empty lines as vertical spacer
                if (step.type === 'text' && step.content.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                return renderTypedStep(step, i);
              });
            })()}
            {stream.status === "streaming" && (
              <span className="inline-block w-2 h-4 bg-[#FACC15] animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
        )}

        {/* Error message */}
        {stream.status === "error" && stream.errorMsg && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{stream.errorMsg}</span>
          </div>
        )}

        {/* Command result */}
        {stream.commandResult && (
          <div className="mt-2">
            {stream.commandResult.command && (
              <div className="text-[10px] text-[#6B6B6B] font-mono mb-1">
                $ {stream.commandResult.command}
              </div>
            )}
            <pre className="text-xs text-[#E4E2DD]/80 whitespace-pre-wrap font-mono bg-black/40 rounded-lg p-2 border border-white/5 overflow-x-auto">
              {stream.commandResult.result}
            </pre>
          </div>
        )}

        {/* Tool calls — collapsible section */}
        {stream.tools.length > 0 && (
          <div className="mt-2 border-t border-white/5 pt-2">
            <button
              onClick={() => toggleToolsExpand(stream.sessionId)}
              className="flex items-center gap-1 text-xs font-mono text-[#6B6B6B] hover:text-[#E4E2DD] transition-colors"
            >
              {expandedTools.has(stream.sessionId) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>Tools ({stream.tools.length})</span>
            </button>
            {expandedTools.has(stream.sessionId) && (
              <div className="mt-1 space-y-1">
                {stream.tools.map((tool) => (
                  <div key={tool.id} className="flex items-center gap-1.5 text-xs font-mono text-[#E4E2DD]/80">
                    <ToolIcon name={tool.name} />
                    <span className="truncate max-w-[200px]">{tool.name}</span>
                    {tool.status === "running" ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#FACC15] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Todo items */}
        {stream.todoItems.length > 0 && (
          <div className="mt-2 border-t border-white/5 pt-2">
            <div className="text-[10px] text-[#6B6B6B] font-mono mb-1">Todo:</div>
            {stream.todoItems.map((item, i) => (
              <div key={i} className="text-xs font-mono text-[#E4E2DD]/80 leading-relaxed">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  /** Render a user message bubble */
  const renderUserMessage = (msg: UserMessage) => (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2 justify-end"
    >
      {/* Bubble */}
      <div className="max-w-[85%] rounded-xl px-3.5 py-2 bg-[#FACC15]/10 border border-[#FACC15]/20 text-[#E4E2DD]">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-[#FACC15]/80">You</span>
          <span className="text-[10px] text-[#6B6B6B]/60 ml-auto">
            {formatTime(msg.timestamp)}
          </span>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-0.5">
          {msg.content}
        </div>
      </div>

      {/* Avatar */}
      <div className="shrink-0 w-7 h-7 rounded-full bg-[#FACC15] flex items-center justify-center mt-0.5">
        <User className="w-3.5 h-3.5 text-black" />
      </div>
    </motion.div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#0A0A0A]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {displayItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="p-3 rounded-full bg-[#FACC15]/10 mb-4">
                <Bot className="w-8 h-8 text-[#FACC15]" />
              </div>
              <p className="text-[#E4E2DD] font-medium mb-1">Career-Ops Agent</p>
              <p className="text-[#6B6B6B] text-sm max-w-sm">
                Type a command or use / to see available modes
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {modes.slice(0, 6).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setInput(`/${mode.command} `);
                      inputRef.current?.focus();
                    }}
                    disabled={!isConnected}
                    className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#6B6B6B] hover:text-[#E4E2DD] hover:border-white/20 transition-colors disabled:opacity-40"
                  >
                    /{mode.command}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {displayItems.map((item) => {
            if ("role" in item && item.role === "user") return renderUserMessage(item);
            return renderSessionStream(item as SessionStream);
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 bg-[#121212] p-3 relative">
        {showAutocomplete && filteredModes.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="px-3 py-1.5 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">
              Commands
            </div>
            {filteredModes.map((mode, idx) => (
              <button
                key={mode.id}
                onClick={() => selectAutocomplete(idx)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  idx === autocompleteIndex
                    ? "bg-[#FACC15]/10 text-[#FACC15]"
                    : "text-[#E4E2DD] hover:bg-white/5"
                }`}
              >
                <Slash className="w-3.5 h-3.5 shrink-0 text-[#6B6B6B]" />
                <span className="font-mono">{mode.command}</span>
                <span className="text-xs text-[#6B6B6B] ml-auto truncate max-w-[200px]">
                  {mode.description}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowAutocomplete(e.target.value.startsWith("/"));
                setAutocompleteIndex(0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowAutocomplete(input.startsWith("/"))}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              placeholder={
                isConnected
                  ? 'Type a command or / for modes...'
                  : "Connecting..."
              }
              disabled={!isConnected}
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-[#E4E2DD] placeholder-[#6B6B6B] focus:outline-none focus:border-[#FACC15]/40 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected}
            className="shrink-0 p-2.5 rounded-lg bg-[#FACC15] text-black hover:bg-[#FACC15]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {activeSession && (
          <div className="mt-1.5 text-[10px] text-[#6B6B6B] font-mono text-center">
            session: {activeSession.slice(0, 16)}...
          </div>
        )}
      </div>
      <style>{`
        @keyframes thinking-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes thinking-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-thinking-pulse {
          animation: thinking-pulse 0.8s ease-in-out infinite;
        }
        .animate-thinking-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(250,204,21,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: thinking-shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
