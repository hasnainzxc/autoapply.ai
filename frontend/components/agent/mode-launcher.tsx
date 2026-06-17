"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BarChart3,
  Send,
  FileText,
  GitBranch,
  Sparkles,
} from "lucide-react";

interface ModeCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "select" | "number";
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }>;
}

const modes: ModeCard[] = [
  {
    id: "scan",
    name: "Scan",
    description: "Discover job listings from portals",
    icon: <Search className="w-5 h-5" />,
    fields: [
      {
        name: "portal",
        label: "Portal",
        type: "select",
        options: ["greenhouse", "linkedin", "indeed", "all"],
        required: true,
      },
      { name: "keywords", label: "Keywords", type: "text", placeholder: "e.g. senior engineer" },
      { name: "location", label: "Location", type: "text", placeholder: "e.g. Dubai" },
      { name: "limit", label: "Limit", type: "number", placeholder: "10" },
    ],
  },
  {
    id: "evaluate",
    name: "Evaluate",
    description: "Score a job against your profile",
    icon: <BarChart3 className="w-5 h-5" />,
    fields: [
      { name: "jobUrl", label: "Job URL", type: "text", placeholder: "https://...", required: true },
      { name: "company", label: "Company", type: "text", placeholder: "(optional)" },
    ],
  },
  {
    id: "apply",
    name: "Apply",
    description: "Auto-submit application",
    icon: <Send className="w-5 h-5" />,
    fields: [
      { name: "jobUrl", label: "Job URL", type: "text", placeholder: "https://...", required: true },
      { name: "coverLetter", label: "Cover Letter", type: "text", placeholder: "Optional text" },
    ],
  },
  {
    id: "pdf",
    name: "PDF",
    description: "Generate CV in PDF/LaTeX",
    icon: <FileText className="w-5 h-5" />,
    fields: [
      {
        name: "template",
        label: "Template",
        type: "select",
        options: ["modern", "clean", "executive"],
      },
      { name: "format", label: "Format", type: "select", options: ["pdf", "latex"] },
    ],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    description: "Process pending jobs in queue",
    icon: <GitBranch className="w-5 h-5" />,
    fields: [
      { name: "limit", label: "Limit", type: "number", placeholder: "5" },
    ],
  },
];

interface ModeLauncherProps {
  isConnected: boolean;
  onLaunch: (mode: string, args: Record<string, unknown>) => void;
}

export function ModeLauncher({ isConnected, onLaunch }: ModeLauncherProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const mode = modes.find((m) => m.id === selectedMode);

  const handleLaunch = () => {
    if (!mode) return;
    const args: Record<string, unknown> = {};
    for (const field of mode.fields) {
      const val = formValues[field.name]?.trim();
      if (val) {
        if (field.type === "number") {
          args[field.name] = parseInt(val, 10);
        } else {
          args[field.name] = val;
        }
      }
    }
    onLaunch(mode.id, args);
    setSelectedMode(null);
    setFormValues({});
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {modes.map((m) => (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedMode(m.id);
              setFormValues({});
            }}
            disabled={!isConnected}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
              selectedMode === m.id
                ? "bg-[#FACC15]/10 border-[#FACC15]/40 text-[#FACC15]"
                : "bg-white/5 border-white/10 text-[#E4E2DD] hover:bg-white/10 hover:border-white/20"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="p-2 rounded-lg bg-white/5">{m.icon}</div>
            <span className="text-sm font-medium">{m.name}</span>
            <span className="text-xs text-[#6B6B6B]">{m.description}</span>
          </motion.button>
        ))}
      </div>

      {/* Form panel */}
      {mode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#FACC15]" />
            <span className="text-[#E4E2DD] font-medium">{mode.name}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {mode.fields.map((field) => (
              <div key={field.name}>
                <label className="text-xs text-[#6B6B6B] block mb-1">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    value={formValues[field.name] ?? ""}
                    onChange={(e) =>
                      setFormValues((p) => ({ ...p, [field.name]: e.target.value }))
                    }
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E4E2DD] focus:outline-none focus:border-[#FACC15]/50"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formValues[field.name] ?? ""}
                    onChange={(e) =>
                      setFormValues((p) => ({ ...p, [field.name]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#E4E2DD] placeholder-[#6B6B6B] focus:outline-none focus:border-[#FACC15]/50"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLaunch}
              className="px-4 py-2 rounded-lg bg-[#FACC15] text-black text-sm font-medium hover:bg-[#FACC15]/90 transition-colors"
            >
              Launch
            </button>
            <button
              onClick={() => setSelectedMode(null)}
              className="px-4 py-2 rounded-lg bg-white/5 text-[#6B6B6B] text-sm hover:text-[#E4E2DD] transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {!isConnected && (
        <p className="text-center text-xs text-[#6B6B6B]">
          Agent WebSocket not connected. Launch button disabled.
        </p>
      )}
    </div>
  );
}
