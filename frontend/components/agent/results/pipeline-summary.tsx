"use client";

import { CheckCircle, XCircle, SkipForward } from "lucide-react";

interface PipelineEntryResult {
  url: string;
  title?: string;
  company?: string;
  status: string;
  error?: string;
}

interface PipelineSummaryProps {
  processed: number;
  failed: number;
  skipped: number;
  summary: string;
  entries: PipelineEntryResult[];
}

export function PipelineSummary({
  processed,
  failed,
  skipped,
  summary,
  entries,
}: PipelineSummaryProps) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-[#6B6B6B]">{summary}</p>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-400">{processed}</div>
          <div className="text-xs text-[#6B6B6B]">Processed</div>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-red-400">{failed}</div>
          <div className="text-xs text-[#6B6B6B]">Failed</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
          <SkipForward className="w-5 h-5 text-[#6B6B6B] mx-auto mb-1" />
          <div className="text-lg font-bold text-[#6B6B6B]">{skipped}</div>
          <div className="text-xs text-[#6B6B6B]">Skipped</div>
        </div>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div>
          <h4 className="text-xs text-[#6B6B6B] mb-2 font-medium uppercase tracking-wide">
            Details
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {entries.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-xs"
              >
                {e.status === "processed" && (
                  <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                )}
                {e.status === "failed" && (
                  <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                {e.status === "skipped" && (
                  <SkipForward className="w-3 h-3 text-[#6B6B6B] shrink-0" />
                )}
                <span className="text-[#E4E2DD] truncate">
                  {e.title ?? e.company ?? e.url}
                </span>
                {e.error && (
                  <span className="text-red-400 ml-auto text-xs">{e.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
