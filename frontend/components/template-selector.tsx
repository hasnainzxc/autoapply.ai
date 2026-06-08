"use client";

import { motion } from "framer-motion";
import { Check, Palette, Zap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Template {
  id: string;
  name: string;
  description: string;
  ats_score?: string;
  visually_striking?: boolean;
  // Allow backend response shape flexibility
  [key: string]: unknown;
}

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
}

// Inline templates for when backend hasn't returned any
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Cyan/purple gradient, tech-focused, Space Grotesk headings",
    ats_score: "95%",
    visually_striking: true,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Black & white, minimalist, highest ATS compatibility",
    ats_score: "98%",
    visually_striking: false,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Teal & gold, spacious layout for senior roles",
    ats_score: "93%",
    visually_striking: true,
  },
];

const TEMPLATE_ICONS: Record<string, typeof Palette> = {
  modern: Zap,
  modern_tech: Zap,
  classic: Briefcase,
  clean_professional: Briefcase,
  executive: Palette,
};

const TEMPLATE_COLORS: Record<string, string> = {
  modern: "from-cyan-500 to-purple-500",
  modern_tech: "from-cyan-500 to-purple-500",
  classic: "from-gray-500 to-gray-700",
  clean_professional: "from-gray-500 to-gray-700",
  executive: "from-teal-500 to-amber-500",
};

export function TemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
}: TemplateSelectorProps) {
  const displayTemplates =
    templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  return (
    <div className="resume-template-selector resume-no-print">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Palette className="w-4 h-4 text-[#6B6B6B]" />
        <span className="text-sm font-medium text-white">Choose Template</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {displayTemplates.map((t, i) => {
          const isSelected =
            selectedTemplate === t.id ||
            // Also match backend IDs
            (t.id === "modern_tech" && selectedTemplate === "modern") ||
            (t.id === "clean_professional" && selectedTemplate === "classic") ||
            (t.id === "executive" && selectedTemplate === "executive");

          const normalizedId =
            t.id === "modern_tech"
              ? "modern"
              : t.id === "clean_professional"
                ? "classic"
                : t.id;

          const gradient = TEMPLATE_COLORS[t.id] ?? "from-gray-500 to-gray-700";
          const Icon = TEMPLATE_ICONS[t.id] ?? Palette;
          const atsLabel = t.ats_score ?? "90%+";

          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSelect(normalizedId)}
              className={cn(
                "relative flex-shrink-0 w-44 rounded-xl border p-3 text-left transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-[#FACC15]/50",
                isSelected
                  ? "bg-[#FACC15]/10 border-[#FACC15]/30 shadow-[0_0_20px_-5px_rgba(250,204,21,0.2)]"
                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FACC15] flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}

              {/* Thumbnail mock */}
              <div
                className={cn(
                  "w-full h-16 rounded-lg mb-2 bg-gradient-to-br",
                  gradient
                )}
              >
                <div className="w-full h-full rounded-lg bg-black/20 p-2 flex flex-col gap-1">
                  <div className="h-1.5 w-3/4 rounded bg-white/40" />
                  <div className="h-1 w-1/2 rounded bg-white/20" />
                  <div className="flex-1" />
                  <div className="h-1 w-2/3 rounded bg-white/20" />
                  <div className="h-1 w-1/2 rounded bg-white/10" />
                </div>
              </div>

              {/* Template info */}
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span className="text-sm font-semibold text-white">
                  {t.name}
                </span>
              </div>
              <p className="text-[10px] text-[#6B6B6B] leading-relaxed line-clamp-2 mb-2">
                {t.description}
              </p>

              {/* ATS badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    isSelected
                      ? "bg-[#FACC15]/20 text-[#FACC15]"
                      : "bg-green-500/10 text-green-400"
                  )}
                >
                  {atsLabel} ATS
                </span>
                {t.visually_striking && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                    Premium
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
