"use client";

import { useEffect, useState } from "react";

interface Agent {
  id: string;
  job_title: string;
  status: string;
  progress: number;
}

export function ActiveAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    async function fetchActiveAgents() {
      try {
        const res = await fetch("/api/applications?status=applying");
        if (res.ok) {
          const data = await res.json();
          setAgents(data.map((a: any) => ({
            id: a.id,
            job_title: a.job_title || "Job Application",
            status: a.status,
            progress: getProgress(a.status),
          })));
        }
      } catch (e) {
        console.error("Failed to fetch agents", e);
      }
    }
    fetchActiveAgents();
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h2 className="text-lg font-semibold text-white mb-5">Active Agents</h2>
      
      {agents.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">No active agents</p>
      ) : (
        <div className="space-y-5">
          {agents.map((agent) => (
            <div key={agent.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300 truncate">{agent.job_title}</span>
                <span className="text-purple-400 font-medium">{agent.progress}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-600 capitalize">{agent.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getProgress(status: string): number {
  const progress: Record<string, number> = {
    queued: 10,
    scraping: 30,
    analyzing: 50,
    crafting: 70,
    applying: 90,
    confirmed: 100,
    failed: 0,
  };
  return progress[status] || 0;
}
