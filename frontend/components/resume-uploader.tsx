"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ResumeUploaderProps {
  onUploadComplete: (resumeId: string, filename: string) => void;
}

export function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadStatus("success");
        onUploadComplete(data.resume_id, file.name);
      } else {
        setUploadStatus("error");
      }
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
          ${dragActive 
            ? "border-[#FACC15] bg-[#FACC15]/5" 
            : "border-white/10 hover:border-[#FACC15]/50 hover:bg-white/5"
          }
          ${uploadStatus === "success" ? "border-green-500/50 bg-green-500/5" : ""}
          ${uploadStatus === "error" ? "border-red-500/50 bg-red-500/5" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
        />

        <div className="p-12 text-center">
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <Loader2 className="w-12 h-12 text-[#FACC15] animate-spin mb-4" />
                <p className="text-[#E4E2DD] font-medium">Uploading {fileName}...</p>
                <p className="text-[#6B6B6B] text-sm mt-2">Extracting text from resume</p>
              </motion.div>
            ) : uploadStatus === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-[#E4E2DD] font-medium">{fileName}</p>
                <p className="text-green-400 text-sm mt-2">Resume uploaded successfully!</p>
              </motion.div>
            ) : uploadStatus === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-[#E4E2DD] font-medium">Upload failed</p>
                <p className="text-red-400 text-sm mt-2">Please try again</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#FACC15]/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-[#FACC15]" />
                </div>
                <p className="text-[#E4E2DD] font-medium text-lg mb-2">
                  Drop your resume here
                </p>
                <p className="text-[#6B6B6B]">
                  or click to browse • PDF or DOCX
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-center text-[#6B6B6B] text-sm mt-4">
        Your resume will be analyzed and optimized for ATS systems
      </p>
    </motion.div>
  );
}
