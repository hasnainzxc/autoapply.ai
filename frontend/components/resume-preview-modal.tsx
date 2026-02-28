"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Copy, Check, File, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Resume {
  id: string;
  name: string;
  original_file_path: string;
  extracted_text: string;
  created_at: string;
  last_used_at?: string;
}

interface ResumePreviewModalProps {
  resume: Resume | null;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ResumePreviewModal({ resume, isOpen, onClose }: ResumePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setViewMode("pdf");
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (resume?.extracted_text) {
      await navigator.clipboard.writeText(resume.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const pdfUrl = resume ? `${API_URL}/api/resume/${resume.id}/view` : "";

  return (
    <AnimatePresence>
      {isOpen && resume && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-5xl h-[90vh] bg-[#0A0A0A] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#FACC15]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{resume.name || "Resume"}</h2>
                  <p className="text-xs text-[#6B6B6B]">
                    Uploaded {formatDate(resume.created_at)}
                    {resume.last_used_at && ` • Last used ${formatDate(resume.last_used_at)}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("pdf")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "pdf" 
                        ? "bg-[#FACC15] text-black" 
                        : "text-[#6B6B6B] hover:text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    onClick={() => setViewMode("text")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "text" 
                        ? "bg-[#FACC15] text-black" 
                        : "text-[#6B6B6B] hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Text
                  </button>
                </div>
                
                {viewMode === "text" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-[#6B6B6B]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-[#1A1A1A]">
              {viewMode === "pdf" ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Resume PDF Preview"
                />
              ) : (
                <div className="h-full overflow-y-auto p-6">
                  {resume.extracted_text ? (
                    <div className="max-w-3xl mx-auto">
                      <pre className="whitespace-pre-wrap text-sm sm:text-base text-[#E4E2DD] font-sans leading-relaxed">
                        {resume.extracted_text}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-[#6B6B6B]" />
                        </div>
                        <p className="text-[#6B6B6B]">No text extracted from this resume</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-[#0A0A0A]/95 backdrop-blur-sm flex-shrink-0">
              <p className="text-xs text-[#6B6B6B]">
                {viewMode === "text" 
                  ? `${resume.extracted_text?.length.toLocaleString() || 0} characters`
                  : "Previewing original PDF"
                }
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => window.open(pdfUrl, "_blank")}
                >
                  <File className="w-4 h-4 mr-1.5" />
                  Download
                </Button>
                <Button
                  onClick={onClose}
                  className="rounded-xl bg-[#FACC15] text-black hover:bg-[#FACC15]/90"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
