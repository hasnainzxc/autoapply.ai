"use client";

import { resumeToHtml, type TailoredResumeSchema } from "@/lib/resume-to-html";
import { useState, useEffect, useRef } from "react";
import { Loader2, Printer, Download, CheckCircle2, AlertCircle } from "lucide-react";

interface ResumeRendererProps {
  resumeData: TailoredResumeSchema;
  template: string;
  onPrint?: () => void;
  onTemplateChange?: (template: string) => void;
  onUseResume?: () => void;
}

export function ResumeRenderer({
  resumeData,
  template,
  onPrint,
  onUseResume,
}: ResumeRendererProps) {
  const [hasError, setHasError] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const prevDataRef = useRef(resumeData);
  const prevTemplateRef = useRef(template);

  // Compute HTML in effect — avoid setState inside useMemo (React 18 StrictMode issue)
  useEffect(() => {
    // Skip if nothing changed
    if (prevDataRef.current === resumeData && prevTemplateRef.current === template && htmlContent) {
      return;
    }
    prevDataRef.current = resumeData;
    prevTemplateRef.current = template;

    setHasError(false);
    try {
      const html = resumeToHtml(resumeData, template);
      setHtmlContent(html);
    } catch (err) {
      setHasError(true);
      console.error("Resume HTML generation failed:", err);
      setHtmlContent("");
    }
  }, [resumeData, template, htmlContent]);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Render Error</h3>
        <p className="text-[#6B6B6B] max-w-xs">
          Could not render resume. The data may be malformed or incomplete.
        </p>
      </div>
    );
  }

  return (
    <div className="resume-print-area flex flex-col h-full">
      {/* Toolbar - hidden when printing */}
      <div className="resume-toolbar resume-no-print flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0A0A0A] shrink-0">
        <span className="text-sm text-[#6B6B6B]">Resume Preview</span>
        <div className="flex items-center gap-2">
          {onUseResume && (
            <button
              onClick={onUseResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] text-black text-sm font-medium hover:bg-[#FACC15]/90 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Use This Resume
            </button>
          )}
          <button
            onClick={onPrint ?? (() => window.print())}
            className="resume-no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] text-black text-sm font-medium hover:bg-[#FACC15]/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div className="resume-preview-container flex-1 overflow-auto bg-neutral-100">
        {!htmlContent && !hasError && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#FACC15] animate-spin" />
              <span className="text-sm text-[#6B6B6B]">Building resume preview...</span>
            </div>
          </div>
        )}

        {htmlContent && (
          <div
            className="resume-container max-w-[8.5in] mx-auto my-6 bg-white shadow-lg"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
}
