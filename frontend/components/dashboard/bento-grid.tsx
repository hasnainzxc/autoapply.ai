"use client";

interface BentoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "violet" | "cyan" | "emerald" | "amber";
}

const colorMap = {
  violet: {
    bg: "from-violet-500/10 to-violet-500/5",
    border: "hover:border-violet-500/30",
    icon: "text-violet-400",
    glow: "hover:shadow-[0_0_30px_-10px_rgba(167,139,250,0.3)]",
  },
  cyan: {
    bg: "from-cyan-500/10 to-cyan-500/5",
    border: "hover:border-cyan-500/30",
    icon: "text-cyan-400",
    glow: "hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)]",
  },
  emerald: {
    bg: "from-emerald-500/10 to-emerald-500/5",
    border: "hover:border-emerald-500/30",
    icon: "text-emerald-400",
    glow: "hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.3)]",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-500/5",
    border: "hover:border-amber-500/30",
    icon: "text-amber-400",
    glow: "hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.3)]",
  },
};

export function BentoCard({ title, value, subtitle, icon, trend, color = "violet" }: BentoCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`glass-card p-6 rounded-2xl bg-gradient-to-br ${colors.bg} border-white/5 ${colors.border} ${colors.glow} transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-sm text-zinc-500 mt-2">{subtitle}</p>}
        </div>
        {icon && <div className={colors.icon}>{icon}</div>}
      </div>
      {trend && (
        <div className={`mt-4 text-sm font-medium ${
          trend === "up" ? "text-emerald-400" : 
          trend === "down" ? "text-red-400" : "text-zinc-400"
        }`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} 
        </div>
      )}
    </div>
  );
}

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <BentoCard 
        title="Active Agents" 
        value={3} 
        subtitle="Currently running"
        color="violet"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <BentoCard 
        title="Success Rate" 
        value="78%" 
        subtitle="Last 30 days" 
        trend="up"
        color="emerald"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <BentoCard 
        title="Applications" 
        value={12} 
        subtitle="This month"
        color="cyan"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      <BentoCard 
        title="Match Score" 
        value="85%" 
        subtitle="AI compatibility"
        color="amber"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        }
      />
    </div>
  );
}
