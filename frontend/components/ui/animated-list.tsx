"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className = "" }: AnimatedListProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <AnimatePresence>
        {children}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedListItem({ 
  children, 
  className = "", 
  delay = 0 
}: AnimatedListItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ApplicationItemProps {
  title: string;
  company: string;
  status: "queued" | "analyzing" | "applying" | "applied" | "failed";
  matchScore?: number;
  timestamp?: string;
}

const statusColors = {
  queued: "bg-[#6B6B6B]",
  analyzing: "bg-[#F59E0B]",
  applying: "bg-[#FACC15]",
  applied: "bg-[#22C55E]",
  failed: "bg-[#EF4444]",
};

const statusLabels = {
  queued: "Queued",
  analyzing: "Analyzing",
  applying: "Applying",
  applied: "Applied",
  failed: "Failed",
};

export function ApplicationItem({ 
  title, 
  company, 
  status, 
  matchScore,
  timestamp 
}: ApplicationItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-4 rounded-xl border border-white/5 flex items-center gap-4"
    >
      {/* Status Indicator */}
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        {status === "applying" && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${statusColors[status]} animate-ping opacity-75`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[#E4E2DD] font-medium truncate">{title}</h4>
        <p className="text-[#6B6B6B] text-sm truncate">{company}</p>
      </div>

      {/* Match Score */}
      {matchScore !== undefined && (
        <div className="text-right">
          <div className="text-lg font-mono font-semibold text-[#FACC15]">
            {matchScore}%
          </div>
          <div className="text-xs text-[#6B6B6B]">match</div>
        </div>
      )}

      {/* Status Badge */}
      <div className={`
        px-3 py-1 rounded-full text-xs font-medium
        ${status === "applied" ? "bg-[#22C55E]/20 text-[#22C55E]" : 
          status === "failed" ? "bg-[#EF4444]/20 text-[#EF4444]" :
          status === "applying" ? "bg-[#FACC15]/20 text-[#FACC15]" :
          "bg-[#6B6B6B]/20 text-[#6B6B6B]"}
      `}>
        {statusLabels[status]}
      </div>
    </motion.div>
  );
}
