"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "./status-badge";
import { FileText, ExternalLink } from "lucide-react";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  status: string;
  match_score: number;
  score_rating: string;
  has_pdf: boolean;
  portal: string;
  notes: string;
  applied_at: string;
  created_at: string;
}

interface ApplicationTableProps {
  applications: Application[];
  onSelect: (app: Application) => void;
}

export function ApplicationTable({ applications, onSelect }: ApplicationTableProps) {
  if (applications.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl border border-white/5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#6B6B6B]" />
        </div>
        <p className="text-[#E4E2DD] font-medium mb-1">No applications yet</p>
        <p className="text-[#6B6B6B] text-sm">Add a job from the Jobs page to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {applications.map((app, i) => (
        <motion.button
          key={app.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onSelect(app)}
          className="w-full glass-card p-4 rounded-xl border border-white/5 hover:border-[#FACC15]/20 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            {/* Score */}
            <div className="hidden sm:flex flex-col items-center w-12">
              {app.match_score !== null && app.match_score !== undefined ? (
                <>
                  <span className={`text-lg font-mono font-bold ${
                    app.match_score >= 70 ? "text-[#22C55E]" :
                    app.match_score >= 40 ? "text-[#F59E0B]" : "text-[#EF4444]"
                  }`}>
                    {app.match_score}%
                  </span>
                  {app.score_rating && (
                    <span className="text-[10px] text-[#6B6B6B] -mt-0.5">{app.score_rating}</span>
                  )}
                </>
              ) : (
                <span className="text-lg font-mono font-bold text-[#6B6B6B]">--</span>
              )}
            </div>

            {/* Company / Role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-[#E4E2DD] font-medium truncate group-hover:text-[#FACC15] transition-colors">
                  {app.company_name || "Unknown Company"}
                </h4>
                {app.has_pdf && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                    <span className="text-[8px] text-[#22C55E]">PDF</span>
                  </span>
                )}
                {app.portal && (
                  <span className="shrink-0 text-[10px] text-[#6B6B6B] bg-white/5 px-1.5 py-0.5 rounded font-mono">
                    {app.portal}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6B6B6B] truncate">
                {app.job_title || "Unknown Role"}
                {app.location && ` • ${app.location}`}
              </p>
            </div>

            {/* Date */}
            <div className="hidden md:block text-right">
              <p className="text-xs text-[#6B6B6B] font-mono">
                {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : 
                 app.created_at ? new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "--"}
              </p>
            </div>

            {/* Status */}
            <StatusBadge status={app.status} />

            {/* Arrow */}
            <ExternalLink className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#FACC15] transition-colors shrink-0" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}
