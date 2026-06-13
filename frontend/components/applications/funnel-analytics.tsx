"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FunnelStage {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export function FunnelAnalytics() {
  const [stages, setStages] = useState<FunnelStage[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/applications/stats`)
      .then(r => r.json())
      .then((data) => {
        const total = data.applied_count || 1;
        setStages([
          { label: "Applied", count: data.applied_count || 0, pct: 100, color: "bg-[#22C55E]" },
          { label: "Responded", count: data.responded_count || 0, pct: Math.round((data.responded_count / total) * 100), color: "bg-[#3B82F6]" },
          { label: "Interview", count: data.interview_count || 0, pct: Math.round((data.interview_count / total) * 100), color: "bg-[#A855F7]" },
          { label: "Offer", count: data.offer_count || 0, pct: Math.round((data.offer_count / total) * 100), color: "bg-[#06B6D4]" },
        ]);
      })
      .catch(() => {});
  }, []);

  if (stages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl border border-white/5"
    >
      <h3 className="text-lg font-semibold text-[#E4E2DD] mb-5">Application Funnel</h3>
      <div className="space-y-4">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-[#E4E2DD]">{stage.label}</span>
              <span className="text-[#6B6B6B]">{stage.count} ({stage.pct}%)</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${stage.color} opacity-80`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
