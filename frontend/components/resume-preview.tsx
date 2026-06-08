"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ResumeRenderer } from "@/components/resume-renderer";
import { TemplateSelector, type Template } from "@/components/template-selector";
import { apiGet } from "@/lib/api-client";
import type { TailoredResumeSchema } from "@/lib/resume-to-html";

interface ResumePreviewProps {
  resumeData: TailoredResumeSchema;
  onUseResume?: () => void;
}

interface TemplatesResponse {
  templates: Template[];
}

export function ResumePreview({ resumeData, onUseResume }: ResumePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Use the template from the resume data if available
  useEffect(() => {
    if (resumeData.template_used) {
      // Map backend template IDs to frontend variants
      const map: Record<string, string> = {
        modern_tech: "modern",
        clean_professional: "classic",
        executive: "executive",
      };
      setSelectedTemplate(map[resumeData.template_used] ?? resumeData.template_used);
    }
  }, [resumeData.template_used]);

  // Fetch templates from backend
  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const data = await apiGet<TemplatesResponse>("/api/resume/templates");
        if (!cancelled) {
          setTemplates(data.templates ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setTemplatesError(
            err instanceof Error ? err.message : "Failed to load templates"
          );
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    }

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    // Small delay to ensure state update renders before print
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, []);

  const handleRetryTemplates = useCallback(() => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    apiGet<TemplatesResponse>("/api/resume/templates")
      .then((data) => setTemplates(data.templates ?? []))
      .catch((err) =>
        setTemplatesError(
          err instanceof Error ? err.message : "Failed to load templates"
        )
      )
      .finally(() => setTemplatesLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0A]">
      {/* Template selector area */}
      <div className="shrink-0 px-4 pt-4 pb-2 border-b border-white/5">
        <AnimatePresence mode="wait">
          {templatesLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-2"
            >
              <Loader2 className="w-4 h-4 text-[#6B6B6B] animate-spin" />
              <span className="text-sm text-[#6B6B6B]">Loading templates...</span>
            </motion.div>
          ) : templatesError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 py-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{templatesError}</span>
              <button
                onClick={handleRetryTemplates}
                className="ml-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Retry"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TemplateSelector
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Renderer area — fills remaining height */}
      <div className="flex-1 min-h-0">
        <ResumeRenderer
          resumeData={resumeData}
          template={selectedTemplate}
          onTemplateChange={setSelectedTemplate}
          onPrint={handlePrint}
          onUseResume={onUseResume}
        />
      </div>

      {/* Print indicator overlay */}
      <AnimatePresence>
        {isPrinting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="resume-no-print absolute inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#FACC15] animate-spin" />
              <span className="text-white font-medium">
                Preparing print...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
