"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  status: string;
  match_score: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-zinc-400", bg: "bg-zinc-500" },
  scraping: { label: "Scraping", color: "text-amber-400", bg: "bg-amber-500" },
  analyzing: { label: "Analyzing", color: "text-violet-400", bg: "bg-violet-500" },
  crafting: { label: "Drafting", color: "text-blue-400", bg: "bg-blue-500" },
  applying: { label: "Applying", color: "text-cyan-400", bg: "bg-cyan-500" },
  confirmed: { label: "Applied", color: "text-emerald-400", bg: "bg-emerald-500" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500" },
};

export function RecentApplications() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch("/api/applications");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to fetch applications", e);
      }
    }
    fetchApplications();
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">Recent Applications</h2>
        <button className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
          View all <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-zinc-500">No applications yet</p>
          <p className="text-zinc-600 text-sm mt-1">Add a job to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.queued;
            return (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${status.bg} shadow-[0_0_8px_currentColor]`} />
                  <div>
                    <p className="font-medium text-white group-hover:text-violet-300 transition-colors">{app.job_title || "Unknown Job"}</p>
                    <p className="text-sm text-zinc-500">{app.company_name || "Unknown Company"}</p>
                  </div>
                </div>
                <div className="text-right">
                  {app.match_score !== null && app.match_score !== undefined && (
                    <span className="text-sm font-semibold text-violet-400">
                      {app.match_score}%
                    </span>
                  )}
                  <p className={`text-xs mt-1 ${status.color}`}>
                    {status.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
