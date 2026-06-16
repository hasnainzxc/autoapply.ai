"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  timestamp: number;
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
  isStreaming?: boolean;
  isExpanded?: boolean;
}

interface AgentChatProps {
  events: any[];
  activeSession: string | null;
  onSend: (command: string) => void;
  modes: Array<{ id: string; name: string; command: string; description: string }>;
  isConnected: boolean;
  isBusy: boolean;
}

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
  };
  if (!name) return <Terminal className="w-3.5 h-3.5" />;
  const key = Object.keys(iconMap).find((k) => name.toLowerCase().includes(k));
  return key ? iconMap[key] : <Terminal className="w-3.5 h-3.5" />;
}

export function AgentChat({
  events,
  activeSession,
  onSend,
  modes,
  isConnected,
  isBusy,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert events to chat messages
  useEffect(() => {
    if (events.length === 0) return;

    setMessages((prev) => {
      const updated = [...prev];
      const existingIds = new Set(updated.map((m) => m.id));

      for (const evt of events) {
        const evtId = `${evt.sessionId || "anon"}-${evt.timestamp}-${evt.type}`;
        if (existingIds.has(evtId)) continue;
        existingIds.add(evtId);

        if (evt.type === "session_status") {
          if (evt.status === "busy") {
            updated.push({
              id: evtId,
              role: "system",
              content: `Started processing...`,
              timestamp: evt.timestamp || Date.now(),
            });
          } else if (evt.status === "done") {
            updated.push({
              id: evtId,
              role: "system",
              content: `Completed`,
              timestamp: evt.timestamp || Date.now(),
              toolStatus: "done",
            });
          } else if (evt.status === "error") {
            updated.push({
              id: evtId,
              role: "system",
              content: `Error: ${evt.message || "Unknown error"}`,
              timestamp: evt.timestamp || Date.now(),
              toolStatus: "error",
            });
          }
        } else if (evt.type === "text_delta" && evt.text) {
          // Stream into last assistant message or create new one
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
            lastMsg.content += evt.text;
          } else {
            updated.push({
              id: evtId,
              role: "assistant",
              content: evt.text,
              timestamp: evt.timestamp || Date.now(),
              isStreaming: true,
            });
          }
        } else if (evt.type === "command_executed") {
          updated.push({
            id: evtId,
            role: "assistant",
            content: evt.result
              ? typeof evt.result === "string"
                ? evt.result
                : JSON.stringify(evt.result, null, 2)
              : `Command completed: ${evt.command}`,
            timestamp: evt.timestamp || Date.now(),
          });
        } else if (evt.type === "tool_call") {
          updated.push({
            id: evtId,
            role: "tool",
            content: evt.toolName
              ? `Running ${evt.toolName}...`
              : evt.description || "Executing tool...",
            timestamp: evt.timestamp || Date.now(),
            toolName: evt.toolName,
            toolStatus: "running",
            isExpanded: false,
          });
        } else if (evt.type === "tool_result") {
          // Find matching tool call and mark done
          const toolMsg = updated.find(
            (m) => m.role === "tool" && m.toolName === evt.toolName && m.toolStatus === "running"
          );
          if (toolMsg) {
            toolMsg.toolStatus = "done";
            toolMsg.content = evt.result
              ? typeof evt.result === "string"
                ? evt.result.slice(0, 200)
                : JSON.stringify(evt.result).slice(0, 200)
              : `${evt.toolName || "Tool"} completed`;
          } else {
            updated.push({
              id: evtId,
              role: "tool",
              content: evt.result
                ? typeof evt.result === "string"
                  ? evt.result.slice(0, 200)
                  : JSON.stringify(evt.result).slice(0, 200)
                : "Tool completed",
              timestamp: evt.timestamp || Date.now(),
              toolName: evt.toolName,
              toolStatus: "done",
            });
          }
        } else if (evt.type === "error") {
          updated.push({
            id: evtId,
            role: "system",
            content: evt.message || evt.text || "An error occurred",
            timestamp: evt.timestamp || Date.now(),
            toolStatus: "error",
          });
        }
      }

      return updated;
    });
  }, [events]);

  // Close streaming messages when done
  useEffect(() => {
    if (!isBusy) {
      setMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );
    }
  }, [isBusy]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filtered modes for autocomplete
  const filteredModes = input.startsWith("/")
    ? modes.filter((m) =>
        m.command.toLowerCase().includes(input.slice(1).toLowerCase())
      )
    : [];

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !isConnected) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

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
          // Send the command
          const cmd = `/${mode.command}`;
          const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: cmd,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, userMsg]);
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

  const toggleToolExpand = (id: string) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
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

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Avatar */}
              {msg.role !== "user" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#FACC15]/10 flex items-center justify-center mt-0.5">
                  {msg.role === "tool" ? (
                    <ToolIcon name={msg.toolName} />
                  ) : msg.role === "system" ? (
                    msg.toolStatus === "error" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : msg.toolStatus === "done" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5 text-[#6B6B6B]" />
                    )
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-[#FACC15]" />
                  )}
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 ${
                  msg.role === "user"
                    ? "bg-[#FACC15]/10 border border-[#FACC15]/20 text-[#E4E2DD]"
                    : msg.role === "system"
                    ? msg.toolStatus === "done"
                      ? "bg-green-500/10 border border-green-500/20 text-green-300"
                      : msg.toolStatus === "error"
                      ? "bg-red-500/10 border border-red-500/20 text-red-300"
                      : "bg-white/5 border border-white/10 text-[#6B6B6B]"
                    : msg.role === "tool"
                    ? "bg-white/5 border border-white/10"
                    : "bg-white/5 border border-white/10 text-[#E4E2DD]"
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-0.5">
                  {msg.role === "user" && (
                    <span className="text-xs font-medium text-[#FACC15]/80">You</span>
                  )}
                  {msg.role === "assistant" && (
                    <span className="text-xs font-medium text-[#FACC15]/80">Agent</span>
                  )}
                  {msg.role === "tool" && (
                    <button
                      onClick={() => toggleToolExpand(msg.id)}
                      className="flex items-center gap-1 text-xs font-mono text-[#6B6B6B] hover:text-[#E4E2DD] transition-colors"
                    >
                      {expandedTools.has(msg.id) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <span>{msg.toolName || "Tool"}</span>
                      {msg.toolStatus === "running" && (
                        <Loader2 className="w-3 h-3 animate-spin ml-1" />
                      )}
                      {msg.toolStatus === "done" && (
                        <CheckCircle2 className="w-3 h-3 text-green-400 ml-1" />
                      )}
                    </button>
                  )}
                  {msg.role === "system" && (
                    <span className="text-xs text-[#6B6B6B]">
                      {msg.toolStatus === "done" ? "Done" : msg.toolStatus === "error" ? "Error" : "Status"}
                    </span>
                  )}
                  <span className="text-[10px] text-[#6B6B6B]/60 ml-auto">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Content */}
                {msg.role === "tool" ? (
                  <div className={expandedTools.has(msg.id) ? "" : "hidden"}>
                    <pre className="text-xs text-[#E4E2DD]/80 whitespace-pre-wrap font-mono mt-1">
                      {msg.content}
                    </pre>
                  </div>
                ) : msg.role === "system" ? (
                  <p className="text-xs mt-0.5">{msg.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-0.5">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-[#FACC15] animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                )}
              </div>

              {/* User avatar */}
              {msg.role === "user" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#FACC15] flex items-center justify-center mt-0.5">
                  <User className="w-3.5 h-3.5 text-black" />
                </div>
              )}
            </motion.div>
          ))}
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
    </div>
  );
}
