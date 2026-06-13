"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, FileDown, Loader2 } from "lucide-react";

interface ReportViewerProps {
  applicationId: string;
  onClose: () => void;
}

function markdownToHtml(md: string): string {
  return md
    .split("\n")
    .map(line => {
      if (line.startsWith("# ")) return `<h1 class="text-xl font-bold text-[#E4E2DD] mb-4 mt-6 first:mt-0">${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2 class="text-lg font-semibold text-[#FACC15] mb-3 mt-5">${line.slice(3)}</h2>`;
      if (line.startsWith("### ")) return `<h3 class="text-base font-semibold text-[#E4E2DD] mb-2 mt-4">${line.slice(4)}</h3>`;
      if (line.startsWith("---")) return `<hr class="border-white/10 my-6" />`;
      if (line.startsWith("| ")) return parseTableRow(line);
      if (line.match(/^\*\*(.+?)\*\*/)) return `<p class="text-sm text-[#E4E2DD] mb-2 leading-relaxed">${inlineMarkdown(line)}</p>`;
      if (line.startsWith("- ")) return `<li class="text-sm text-[#E4E2DD] ml-4 mb-1 leading-relaxed list-disc">${inlineMarkdown(line.slice(2))}</li>`;
      if (line.startsWith("  - ")) return `<li class="text-sm text-[#6B6B6D] ml-8 mb-1 leading-relaxed list-circle">${inlineMarkdown(line.slice(4))}</li>`;
      if (line.startsWith("  | ")) return parseTableRow(line);
      if (line.match(/^\d+\. /)) {
        const content = line.replace(/^\d+\. /, "");
        return `<li class="text-sm text-[#E4E2DD] ml-4 mb-1 leading-relaxed list-decimal">${inlineMarkdown(content)}</li>`;
      }
      if (line.trim() === "") return "";
      return `<p class="text-sm text-[#E4E2DD] mb-2 leading-relaxed">${inlineMarkdown(line)}</p>`;
    })
    .join("\n");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#FACC15] font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[#FACC15] font-mono text-xs">$1</code>')
    .replace(/\[(\d+)\]\((.+?)\)/g, '<a href="$2" class="text-[#3B82F6] hover:underline" target="_blank">#$1</a>')
    .replace(/✓/g, '<span class="text-[#22C55E]">✓</span>')
    .replace(/✗|❌/g, '<span class="text-[#EF4444]">✗</span>');
}

function parseTableRow(line: string): string {
  const cells = line.split("|").map(c => c.trim()).filter(Boolean);
  const isHeader = line.includes("---");
  if (isHeader) return "";
  const cellHtml = cells.map(c => `<td class="px-3 py-2 text-sm text-[#E4E2DD] border-b border-white/5">${inlineMarkdown(c)}</td>`).join("");
  return `<tr class="hover:bg-white/[0.02]">${cellHtml}</tr>`;
}

export function ReportViewer({ applicationId, onClose }: ReportViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/applications/${applicationId}/report`)
      .then(r => {
        if (!r.ok) throw new Error("Report not found");
        return r.json();
      })
      .then(data => {
        setContent(markdownToHtml(data.content));
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [applicationId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-[#E4E2DD]">Evaluation Report</h2>
          <div className="flex items-center gap-2">
            {content && (
              <button
                onClick={() => {
                  const blob = new Blob([document.querySelector(".report-content")?.innerHTML || ""], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#6B6B6B] hover:text-[#E4E2DD] text-xs transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-[#6B6B6B] hover:text-[#E4E2DD] transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-64px)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[#FACC15] animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-[#6B6B6B]">{error}</p>
            </div>
          ) : (
            <div
              className="report-content space-y-1"
              dangerouslySetInnerHTML={{ __html: content || "" }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
