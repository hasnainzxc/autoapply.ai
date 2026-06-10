"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Stats {
  total: number;
  applied_count: number;
  responded_count: number;
  interview_count: number;
  offer_count: number;
  avg_match_score: number;
  response_rate: number;
  interview_rate: number;
  offer_rate: number;
  with_pdf_count: number;
}

export function TrackerStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/applications/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const items = [
    { label: "Total", value: stats.total, sub: "applications tracked", color: "yellow" },
    { label: "Avg Score", value: `${stats.avg_match_score}%`, sub: "match score", color: "amber" },
    { label: "Response", value: `${stats.response_rate}%`, sub: `${stats.responded_count} responded`, color: "emerald" },
    { label: "Interview", value: `${stats.interview_rate}%`, sub: `${stats.interview_count} interviews`, color: "violet" },
    { label: "Offers", value: `${stats.offer_rate}%`, sub: `${stats.offer_count} offers`, color: "cyan" },
    { label: "PDFs", value: stats.with_pdf_count, sub: "resumes generated", color: "yellow" },
  ];

  const colorMap: Record<string, { bg: string; border: string; glow: string }> = {
    yellow: { bg: "from-[#FACC15]/10 to-[#FACC15]/5", border: "hover:border-[#FACC15]/30", glow: "hover:shadow-[0_0_30px_-10px_rgba(250,204,21,0.3)]" },
    amber: { bg: "from-amber-500/10 to-amber-500/5", border: "hover:border-amber-500/30", glow: "hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.3)]" },
    emerald: { bg: "from-emerald-500/10 to-emerald-500/5", border: "hover:border-emerald-500/30", glow: "hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.3)]" },
    violet: { bg: "from-violet-500/10 to-violet-500/5", border: "hover:border-violet-500/30", glow: "hover:shadow-[0_0_30px_-10px_rgba(167,139,250,0.3)]" },
    cyan: { bg: "from-cyan-500/10 to-cyan-500/5", border: "hover:border-cyan-500/30", glow: "hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]" },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, i) => {
        const c = colorMap[item.color];
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 rounded-xl bg-gradient-to-br ${c.bg} border-white/5 ${c.border} ${c.glow} transition-all duration-300`}
          >
            <p className="text-[10px] font-medium text-[#6B6B6B] uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-[#E4E2DD] tracking-tight">{item.value}</p>
            <p className="text-[10px] text-[#6B6B6B] mt-0.5">{item.sub}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
