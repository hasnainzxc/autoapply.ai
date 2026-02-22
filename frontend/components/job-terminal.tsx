"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, ChevronRight, Loader2, Sparkles, Link, FileText } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface JobTerminalProps {
  resumeId: string;
  onAnalysisComplete: (data: AnalysisData, tailoredId: string) => void;
  onJobDescriptionChange: (desc: string) => void;
}

interface AnalysisData {
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  jobTitle: string;
  company: string;
}

export function JobTerminal({ resumeId, onAnalysisComplete, onJobDescriptionChange }: JobTerminalProps) {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<"url" | "description">("url");
  const [messages, setMessages] = useState<Array<{type: "user" | "system", content: string}>>([
    { type: "system", content: "Welcome to ApplyMate Job Analyzer" },
    { type: "system", content: "Paste a job URL or description to analyze your resume fit" },
  ]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const analyzeJob = async (content: string) => {
    setIsAnalyzing(true);
    
    setMessages(prev => [...prev, { type: "user", content }]);
    setInput("");
    onJobDescriptionChange(content);

    try {
      setMessages(prev => [...prev, { type: "system", content: "🔍 Analyzing job requirements..." }]);
      setMessages(prev => [...prev, { type: "system", content: "📝 Optimizing resume for ATS..." }]);
      
      const formData = new FormData();
      formData.append("resume_id", resumeId);
      formData.append("job_description", content);
      formData.append("template", "default");

      const res = await fetch(`${API_URL}/api/resume/tailor`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        
        const analysisData: AnalysisData = {
          atsScore: data.ats_score_estimate || 75,
          matchedSkills: data.structured_data?.key_skills?.slice(0, 8) || [],
          missingSkills: data.structured_data?.missing_keywords || [],
          suggestions: data.structured_data?.optimization_suggestions || [],
          jobTitle: "Analyzed Position",
          company: "Target Company",
        };
        
        setMessages(prev => [...prev, { 
          type: "system", 
          content: `✅ Analysis complete! ATS Score: ${analysisData.atsScore}/100\n📊 Keywords matched: ${analysisData.matchedSkills.length} | Missing: ${analysisData.missingSkills.length}` 
        }]);
        
        onAnalysisComplete(analysisData, data.tailored_resume_id);
      } else {
        const error = await res.json();
        setMessages(prev => [...prev, { 
          type: "system", 
          content: `❌ Error: ${error.detail || "Analysis failed"}` 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: "system", 
        content: "❌ Connection error. Please try again." 
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSuggestions = (data: any): string[] => {
    const suggestions: string[] = [];
    if (data?.summary) suggestions.push("Update your professional summary to match job keywords");
    if (data?.work_experience?.length) suggestions.push("Quantify achievements with numbers");
    suggestions.push("Add ATS-friendly keywords from the job description");
    suggestions.push("Keep formatting simple - no tables or columns");
    return suggestions;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;
    analyzeJob(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-[#FACC15]" />
        <span className="text-[#E4E2DD] font-medium">Job Input Terminal</span>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === "url" 
              ? "bg-[#FACC15]/20 text-[#FACC15]" 
              : "bg-white/5 text-[#6B6B6B] hover:text-[#E4E2DD]"
          }`}
        >
          <Link className="w-4 h-4" />
          Job URL
        </button>
        <button
          onClick={() => setMode("description")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === "description" 
              ? "bg-[#FACC15]/20 text-[#FACC15]" 
              : "bg-white/5 text-[#6B6B6B] hover:text-[#E4E2DD]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Description
        </button>
      </div>

      <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-[#6B6B6B] ml-2">applymate ~ job-analyzer</span>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${
                msg.type === "user" 
                  ? "ml-8 bg-[#FACC15]/10 border border-[#FACC15]/20 rounded-r-xl rounded-bl-xl" 
                  : "mr-8 bg-white/5 border border-white/10 rounded-l-xl rounded-br-xl"
              } px-4 py-2`}
            >
              <span className={`text-xs ${msg.type === "user" ? "text-[#FACC15]" : "text-[#6B6B6B]"}`}>
                {msg.type === "user" ? "$" : "→"}
              </span>
              <p className="text-[#E4E2DD] text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
            </motion.div>
          ))}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mr-8 bg-white/5 border border-white/10 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2 text-[#6B6B6B]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="text-[#FACC15]">$</span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "url" ? "Paste job URL here..." : "Paste job description here..."}
              className="flex-1 bg-transparent text-[#E4E2DD] placeholder-[#6B6B6B] resize-none focus:outline-none text-sm font-mono"
              rows={2}
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isAnalyzing}
              className="p-2 rounded-lg bg-[#FACC15] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/90 transition-colors"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-[#6B6B6B] text-sm mt-4">
        Press Enter to submit • Works with job URLs or descriptions
      </p>
    </motion.div>
  );
}
