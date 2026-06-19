"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  FilePlus,
  FileEdit,
  FileMinus,
  ListTodo,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentEvent {
  type: string;
  text?: string;
  sessionId?: string;
  timestamp?: number;
  status?: string;
  command?: string;
  result?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  message?: string;
  filePath?: string;
  action?: string;
  todo?: { content: string; status: string };
  code?: string;
}

interface SessionStream {
  sessionId: string;
  events: AgentEvent[];
  status: "streaming" | "done" | "error";
  errorMsg?: string;
  timestamp: number;
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

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentChat({
  events,
  activeSession,
  onSend,
  modes,
  isConnected,
  isBusy,
}: AgentChatProps) {
  const [streams, setStreams] = useState<Map<string, SessionStream>>(new Map());
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [input, setInput] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastProcessedIdxRef = useRef(0);

  // ─── Event → Stream Processing (store raw events) ──────────────────────────

  useEffect(() => {
    const fromIdx = lastProcessedIdxRef.current;
    if (events.length <= fromIdx) return;

    const newEvents = events.slice(fromIdx);
    lastProcessedIdxRef.current = events.length;

    setStreams((prev) => {
      const next = new Map(prev);

      for (const evt of newEvents) {
        const sid = evt.sessionId || "default";

        if (evt.type === "session_status" || evt.type === "session.idle") {
          const idleStatus = evt.type === "session.idle" ? "done" : evt.status;
          if (idleStatus === "busy" || evt.status === "busy") {
            const existing = next.get(sid);
            if (!existing) {
              next.set(sid, {
                sessionId: sid,
                events: [evt],
                status: "streaming",
                timestamp: evt.timestamp || Date.now(),
              });
            } else {
              next.set(sid, {
                ...existing,
                events: [...existing.events, evt],
                status: "streaming",
              });
            }
          } else if (idleStatus === "done") {
            const existing = next.get(sid);
            if (existing) {
              next.set(sid, {
                ...existing,
                events: [...existing.events, evt],
                status: "done",
              });
            }
          } else if (idleStatus === "error") {
            const existing = next.get(sid);
            if (existing) {
              next.set(sid, {
                ...existing,
                events: [...existing.events, evt],
                status: "error",
                errorMsg: evt.message || "Unknown error",
              });
            } else {
              next.set(sid, {
                sessionId: sid,
                events: [evt],
                status: "error",
                errorMsg: evt.message || "Unknown error",
                timestamp: evt.timestamp || Date.now(),
              });
            }
          }
        } else if (evt.type === "text_delta") {
          // Merge text_delta with previous to handle overlapping full-text events
          const existing = next.get(sid);
          if (existing) {
            const lastEvent = existing.events[existing.events.length - 1];
            if (lastEvent?.type === "text_delta") {
              const deduped = dedupAppend(lastEvent.text || "", evt.text || "");
              const updatedEvents = [...existing.events];
              updatedEvents[updatedEvents.length - 1] = {
                ...lastEvent,
                text: (lastEvent.text || "") + deduped,
              };
              next.set(sid, { ...existing, events: updatedEvents });
            } else {
              next.set(sid, { ...existing, events: [...existing.events, evt] });
            }
          } else {
            next.set(sid, {
              sessionId: sid,
              events: [evt],
              status: "streaming",
              timestamp: evt.timestamp || Date.now(),
            });
          }
        } else {
          // All other event types: append to events array
          const existing = next.get(sid);
          if (existing) {
            next.set(sid, { ...existing, events: [...existing.events, evt] });
          } else {
            next.set(sid, {
              sessionId: sid,
              events: [evt],
              status: "streaming",
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
      .filter((s) => s.events.length > 0 || s.status === "error")
      .sort((a, b) => a.timestamp - b.timestamp);

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

  // ─── Auto-scroll on any content change ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // ─── Render: individual event elements ─────────────────────────────────────

  const renderEvent = (evt: AgentEvent, idx: number) => {
    const key = `${evt.type}-${idx}-${evt.timestamp || idx}`;

    switch (evt.type) {
      case "reasoning": {
        const text = evt.text || "Thinking...";
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-[#FACC15]/5 border border-[#FACC15]/10"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FACC15] animate-thinking-pulse" />
            <span className="text-xs text-[#FACC15]/70 font-mono leading-relaxed whitespace-pre-wrap break-words flex-1">
              {text}
            </span>
          </motion.div>
        );
      }

      case "tool_call": {
        const name = evt.toolName || "unknown";
        const argsStr = evt.args ? JSON.stringify(evt.args) : "";
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
          >
            <div className="shrink-0 w-5 h-5 rounded-md bg-[#60A5FA]/10 flex items-center justify-center mt-0.5">
              <ToolIcon name={name} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-[#60A5FA] font-medium truncate">
                {name}
              </div>
              {argsStr && (
                <div className="text-[11px] font-mono text-[#6B6B6B] truncate mt-0.5" title={argsStr}>
                  ({argsStr.length > 80 ? argsStr.slice(0, 80) + "…" : argsStr})
                </div>
              )}
            </div>
            <Loader2 className="w-3 h-3 shrink-0 text-[#FACC15]/60 animate-spin mt-1" />
          </motion.div>
        );
      }

      case "file_edit": {
        const path = evt.filePath || "unknown";
        const action = evt.action || "modify";
        const actionConfig = {
          create: { icon: <FilePlus className="w-3 h-3" />, color: "text-[#4ADE80]", bg: "bg-[#4ADE80]/10", label: "Created" },
          modify: { icon: <FileEdit className="w-3 h-3" />, color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/10", label: "Modified" },
          delete: { icon: <FileMinus className="w-3 h-3" />, color: "text-red-400", bg: "bg-red-400/10", label: "Deleted" },
        };
        const cfg = actionConfig[action as keyof typeof actionConfig] || actionConfig.modify;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-[#6B6B6B]" />
            <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-xs font-mono text-[#E4E2DD]/80 truncate flex-1" title={path}>
              {path}
            </span>
          </motion.div>
        );
      }

      case "todo_update": {
        const todo = evt.todo;
        const content = todo?.content || "Task";
        const done = todo?.status === "completed" || todo?.status === "done";
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-2 py-1"
          >
            <ListTodo className={`w-3.5 h-3.5 shrink-0 ${done ? "text-[#4ADE80]" : "text-[#6B6B6B]"}`} />
            {done ? (
              <CheckCircle2 className="w-3 h-3 shrink-0 text-[#4ADE80]" />
            ) : (
              <div className="w-3 h-3 shrink-0 rounded-sm border border-[#6B6B6B]/50" />
            )}
            <span className={`text-xs font-mono ${done ? "text-[#6B6B6B] line-through" : "text-[#E4E2DD]/80"}`}>
              {content}
            </span>
          </motion.div>
        );
      }

      case "text_delta": {
        const text = evt.text || "";
        if (!text.trim()) return null;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed break-words text-[#E4E2DD] px-1 markdown-dark"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !String(children).includes("\n");
                  return isInline ? (
                    <code className="font-mono bg-black/30 px-1 rounded text-[#E4E2DD]" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="font-mono bg-black/40 p-3 rounded-lg overflow-x-auto border border-white/5 text-xs">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <table className="w-full border-collapse my-2">{children}</table>
                ),
                th: ({ children }) => (
                  <th className="border border-white/10 px-2 py-1 text-left text-xs font-medium text-[#FACC15]/80">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-white/10 px-2 py-1 text-xs text-[#E4E2DD]/80">
                    {children}
                  </td>
                ),
                a: ({ children, href }) => (
                  <a href={href} className="text-[#60A5FA] underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                hr: () => <hr className="border-white/10 my-3" />,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-[#E4E2DD]/80">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-[#FACC15]/30 pl-3 italic text-[#E4E2DD]/60 my-2">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => <h1 className="text-base font-bold text-[#FACC15]/90 mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-[#FACC15]/80 mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-[#E4E2DD]/90 mt-2 mb-0.5">{children}</h3>,
                p: ({ children }) => <p className="text-sm text-[#E4E2DD]/90 my-1">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-[#E4E2DD]">{children}</strong>,
                em: ({ children }) => <em className="italic text-[#E4E2DD]/80">{children}</em>,
              }}
            >
              {text}
            </ReactMarkdown>
          </motion.div>
        );
      }

      case "command_executed": {
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg bg-black/40 border border-white/5 overflow-hidden"
          >
            {evt.command && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/5">
                <Terminal className="w-3 h-3 text-[#6B6B6B]" />
                <span className="text-[10px] font-mono text-[#6B6B6B]">
                  $ {evt.command}
                </span>
              </div>
            )}
            {evt.result && (
              <pre className="text-xs text-[#E4E2DD]/70 font-mono p-2.5 overflow-x-auto whitespace-pre-wrap">
                {evt.result}
              </pre>
            )}
          </motion.div>
        );
      }

      case "error": {
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-red-400/5 border border-red-400/10"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
            <span className="text-xs font-mono text-red-400/90 leading-relaxed flex-1">
              {evt.message || evt.text || "An error occurred"}
            </span>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  /** Render a single SessionStream as a timeline of events */
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
      <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 bg-white/5 border border-white/10 text-[#E4E2DD] min-w-[200px]">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#FACC15]/80">Agent</span>
          <StatusBadge status={stream.status} errorMsg={stream.errorMsg} />
          <span className="text-[10px] text-[#6B6B6B]/60 ml-auto">
            {formatTime(stream.timestamp)}
          </span>
        </div>

        {/* Timeline of events */}
        <div className="space-y-1.5">
          {stream.events.map((evt, idx) => {
            // Skip session_status events — they update header, not timeline
            if (evt.type === "session_status") return null;
            return renderEvent(evt, idx);
          })}
          {/* Cursor for streaming */}
          {stream.status === "streaming" && (
            <span className="inline-block w-2 h-4 bg-[#FACC15] animate-pulse ml-1 rounded-sm" />
          )}
        </div>

        {/* Error fallback */}
        {stream.status === "error" && stream.errorMsg && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{stream.errorMsg}</span>
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
