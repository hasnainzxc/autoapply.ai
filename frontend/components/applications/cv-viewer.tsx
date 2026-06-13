"use client";

import { motion } from "framer-motion";
import { X, FileDown, Loader2, FileText } from "lucide-react";

interface CVViewerProps {
  applicationId: string;
  companyName: string;
  onClose: () => void;
}

export function CVViewer({ applicationId, companyName, onClose }: CVViewerProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const pdfUrl = `${apiUrl}/api/applications/${applicationId}/cv`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E4E2DD]">{companyName}</h2>
              <p className="text-xs text-[#6B6B6B]">Tailored CV / Resume</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#6B6B6B] hover:text-[#E4E2DD] text-xs transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download
            </a>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-[#6B6B6B] hover:text-[#E4E2DD] transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-[#0C0C0C] relative min-h-[60vh]">
          <iframe
            src={pdfUrl}
            className="absolute inset-0 w-full h-full border-0"
            onError={() => {}}
            title={`CV for ${companyName}`}
          />
          {/* Fallback while iframe loads */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-[#6B6B6B]">
              <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
              <p className="text-sm">Loading CV...</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
