"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, ExternalLink, Clock, FileText } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { ReportViewer } from "./report-viewer";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  company_logo: string;
  location: string;
  salary_range: string;
  status: string;
  match_score: number;
  score_rating: string;
  has_pdf: boolean;
  report_path: string;
  portal: string;
  notes: string;
  cv_used: string;
  job_url: string;
  applied_at: string;
  created_at: string;
}

interface Event {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

interface ApplicationDetailProps {
  application: Application;
  onClose: () => void;
}

export function ApplicationDetail({ application, onClose }: ApplicationDetailProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/applications/${application.id}/events`)
      .then(r => r.json())
      .then(setEvents)
      .catch(() => {});
  }, [application.id]);

  const statusUpdateOptions = ["evaluated", "applied", "responded", "interview", "offer", "rejected", "discarded"];

  async function updateStatus(newStatus: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${apiUrl}/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    window.location.reload();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0C0C0C] border-l border-white/[0.08] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0C0C0C]/95 backdrop-blur-xl border-b border-white/[0.06] z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#FACC15]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#E4E2DD]">{application.company_name}</h2>
                  <p className="text-sm text-[#6B6B6B]">{application.job_title}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-[#6B6B6B] hover:text-[#E4E2DD] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Status & Score */}
            <div className="flex items-center gap-3">
              <StatusBadge status={application.status} size="md" showDot />
              {application.match_score !== null && application.match_score !== undefined && (
                <span className={`text-sm font-mono font-bold ${
                  application.match_score >= 70 ? "text-[#22C55E]" :
                  application.match_score >= 40 ? "text-[#F59E0B]" : "text-[#EF4444]"
                }`}>
                  {application.match_score}% match
                  {application.score_rating && <span className="text-[#6B6B6B] font-normal ml-1">({application.score_rating})</span>}
                </span>
              )}
            </div>

            {/* Status Update Buttons */}
            <div>
              <p className="text-xs text-[#6B6B6B] uppercase tracking-wider mb-2 font-medium">Update Status</p>
              <div className="flex flex-wrap gap-1.5">
                {statusUpdateOptions.map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      application.status === s
                        ? "bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]/30"
                        : "bg-white/5 text-[#6B6B6B] border-white/10 hover:bg-white/10 hover:text-[#E4E2DD]"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {application.location && (
                <div className="glass-card p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Location</p>
                  <p className="text-sm text-[#E4E2DD] mt-1">{application.location}</p>
                </div>
              )}
              {application.portal && (
                <div className="glass-card p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Portal</p>
                  <p className="text-sm text-[#E4E2DD] mt-1">{application.portal}</p>
                </div>
              )}
              {application.salary_range && (
                <div className="glass-card p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">Salary</p>
                  <p className="text-sm text-[#E4E2DD] mt-1">{application.salary_range}</p>
                </div>
              )}
              {application.cv_used && (
                <div className="glass-card p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">CV Used</p>
                  <p className="text-sm text-[#E4E2DD] mt-1 font-mono text-xs">{application.cv_used.split("/").pop()}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {application.notes && (
              <div className="glass-card p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-[#E4E2DD] leading-relaxed">{application.notes}</p>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-2">
              {application.report_path && (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FACC15]/10 hover:bg-[#FACC15]/20 text-[#FACC15] text-sm font-medium transition-all border border-[#FACC15]/20"
                >
                  <FileText className="w-4 h-4" />
                  View Report
                </button>
              )}
              {application.job_url && (
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#E4E2DD] text-sm font-medium transition-all border border-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  Job Posting
                </a>
              )}
            </div>

            {/* Event Timeline */}
            {events.length > 0 && (
              <div className="glass-card p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[#6B6B6B]" />
                  <p className="text-xs text-[#6B6B6B] uppercase tracking-wider font-medium">Timeline</p>
                </div>
                <div className="space-y-3">
                  {events.map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-[#FACC15]" : "bg-white/20"}`} />
                        {i < events.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm text-[#E4E2DD]">{event.message}</p>
                        <p className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {showReport && (
        <ReportViewer applicationId={application.id} onClose={() => setShowReport(false)} />
      )}
    </AnimatePresence>
  );
}
