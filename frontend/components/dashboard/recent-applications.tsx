"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  status: string;
  match_score: number;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  queued: "Queued",
  scraping: "Scraping",
  analyzing: "Analyzing",
  crafting: "Drafting",
  applying: "Applying",
  confirmed: "Applied",
  failed: "Failed",
};

const statusColors: Record<string, string> = {
  queued: "bg-zinc-500",
  scraping: "bg-amber-500",
  analyzing: "bg-violet-500",
  crafting: "bg-blue-500",
  applying: "bg-cyan-500",
  confirmed: "bg-green-500",
  failed: "bg-red-500",
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
      <h2 className="text-lg font-semibold text-white mb-5">Recent Applications</h2>
      
      {applications.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">No applications yet</p>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className={`w-2 h-2 rounded-full ${statusColors[app.status] || "bg-zinc-500"}`} />
                <div>
                  <p className="font-medium text-white">{app.job_title || "Unknown Job"}</p>
                  <p className="text-sm text-zinc-500">{app.company_name || "Unknown Company"}</p>
                </div>
              </div>
              <div className="text-right">
                {app.match_score && (
                  <span className="text-sm font-medium text-purple-400">
                    {app.match_score}%
                  </span>
                )}
                <p className="text-xs text-zinc-600 mt-1">
                  {statusLabels[app.status] || app.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
