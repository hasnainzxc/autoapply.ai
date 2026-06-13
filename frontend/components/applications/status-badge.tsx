"use client";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  queued: { label: "Queued", color: "text-[#6B6B6B]", bg: "bg-[#6B6B6B]/20 border-[#6B6B6B]/30", dot: "bg-[#6B6B6B]" },
  evaluated: { label: "Evaluated", color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/20 border-[#F59E0B]/30", dot: "bg-[#F59E0B]" },
  applied: { label: "Applied", color: "text-[#22C55E]", bg: "bg-[#22C55E]/20 border-[#22C55E]/30", dot: "bg-[#22C55E]" },
  responded: { label: "Responded", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/20 border-[#3B82F6]/30", dot: "bg-[#3B82F6]" },
  interview: { label: "Interview", color: "text-[#A855F7]", bg: "bg-[#A855F7]/20 border-[#A855F7]/30", dot: "bg-[#A855F7]" },
  offer: { label: "Offer", color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/20 border-[#06B6D4]/30", dot: "bg-[#06B6D4]" },
  rejected: { label: "Rejected", color: "text-[#EF4444]", bg: "bg-[#EF4444]/20 border-[#EF4444]/30", dot: "bg-[#EF4444]" },
  discarded: { label: "Discarded", color: "text-[#6B6B6B]", bg: "bg-[#6B6B6B]/10 border-[#6B6B6B]/20", dot: "bg-[#6B6B6B]" },
  skip: { label: "Skipped", color: "text-[#6B6B6B]", bg: "bg-[#6B6B6B]/10 border-[#6B6B6B]/20", dot: "bg-[#6B6B6B]" },
  confirmed: { label: "Confirmed", color: "text-[#22C55E]", bg: "bg-[#22C55E]/20 border-[#22C55E]/30", dot: "bg-[#22C55E]" },
  failed: { label: "Failed", color: "text-[#EF4444]", bg: "bg-[#EF4444]/20 border-[#EF4444]/30", dot: "bg-[#EF4444]" },
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({ status, showDot = true, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.queued;
  const sizeClass = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.color} ${sizeClass} font-medium`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}
