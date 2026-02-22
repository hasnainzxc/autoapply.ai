"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CoverLetterGeneratorProps {
  resumeId: string;
  jobDescription: string;
  onClose: () => void;
}

export function CoverLetterGenerator({ resumeId, jobDescription, onClose }: CoverLetterGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const generateCoverLetter = async () => {
    setGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append("resume_id", resumeId);
      formData.append("job_description", jobDescription);
      formData.append("company_name", "");
      formData.append("hiring_manager", "");

      const res = await fetch(`${API_URL}/api/resume/cover-letter`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCoverLetter(data.cover_letter_text);
        setPdfUrl(data.pdf_path);
      }
    } catch (error) {
      console.error("Failed to generate cover letter", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = () => {
    window.open(`${API_URL}${pdfUrl}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16-full bg-gradient-to h-16 rounded-br from-[#FACC15]/20 to-[#FACC15]/5 mb-4">
          <Mail className="w-8 h-8 text-[#FACC15]" />
        </div>
        <h2 className="text-2xl font-bold text-[#E4E2DD]">Cover Letter</h2>
        <p className="text-[#6B6B6B] mt-2">AI-generated cover letter tailored to the job</p>
      </div>

      {!coverLetter && !generating && (
        <div className="text-center">
          <Button 
            onClick={generateCoverLetter}
            className="rounded-full bg-[#FACC15] text-black hover:bg-[#FACC15]/90 px-8"
          >
            <Mail className="w-5 h-5 mr-2" />
            Generate Cover Letter
          </Button>
        </div>
      )}

      {generating && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#FACC15] animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B]">Writing your cover letter...</p>
        </div>
      )}

      {coverLetter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#E4E2DD] font-medium">Your Cover Letter</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="rounded-full border-white/20"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={downloadPdf}
                  className="rounded-full bg-[#FACC15] text-black"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              {coverLetter.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-[#6B6B6B] mb-4 last:mb-0 whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={downloadPdf}
              className="rounded-full bg-[#FACC15] text-black hover:bg-[#FACC15]/90"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full border-white/20"
            >
              Done
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
