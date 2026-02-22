"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResumeUploader } from "./resume-uploader";
import { JobTerminal } from "./job-terminal";
import { AnalysisResults } from "./analysis-results";
import { CoverLetterGenerator } from "./cover-letter";

type FlowStep = "upload" | "job-input" | "analysis" | "cover-letter";

export function ApplyMateFlow() {
  const [step, setStep] = useState<FlowStep>("upload");
  const [resumeId, setResumeId] = useState("");
  const [fileName, setFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredResumeId, setTailoredResumeId] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleUploadComplete = (id: string, filename: string) => {
    setResumeId(id);
    setFileName(filename);
    setStep("job-input");
  };

  const handleAnalysisComplete = (data: any, tailoredId: string) => {
    setAnalysisData(data);
    setTailoredResumeId(tailoredId);
    setStep("analysis");
  };

  const handleTailorSubmit = async (description: string) => {
    setJobDescription(description);
    setStep("analysis");
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleDownloadResume = () => {
    if (tailoredResumeId) {
      window.open(`${API_URL}/api/resume/${tailoredResumeId}/download`, "_blank");
    }
  };

  const handleGenerateCoverLetter = () => {
    setStep("cover-letter");
  };

  const steps = [
    { id: "upload", label: "Upload Resume", icon: "📄" },
    { id: "job-input", label: "Job Details", icon: "🎯" },
    { id: "analysis", label: "Analysis", icon: "📊" },
    { id: "cover-letter", label: "Cover Letter", icon: "✉️" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 mb-12">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all
              ${i <= currentStepIndex 
                ? "bg-[#FACC15]/20 text-[#FACC15]" 
                : "bg-white/5 text-[#6B6B6B]"}
            `}>
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`
                w-8 h-0.5 mx-2 
                ${i < currentStepIndex ? "bg-[#FACC15]" : "bg-white/10"}
              `} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#E4E2DD] mb-2">
                Upload Your Resume
              </h2>
              <p className="text-[#6B6B6B]">
                Start by uploading your resume. We&apos;ll analyze it and optimize for your target job.
              </p>
            </div>
            <ResumeUploader onUploadComplete={handleUploadComplete} />
          </motion.div>
        )}

        {step === "job-input" && (
          <motion.div
            key="job-input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#E4E2DD] mb-2">
                What Job Are You Targeting?
              </h2>
              <p className="text-[#6B6B6B]">
                Paste a job URL or description. We&apos;ll analyze the requirements and optimize your resume.
              </p>
            </div>
            <JobTerminal 
              resumeId={resumeId} 
              onAnalysisComplete={handleAnalysisComplete}
              onJobDescriptionChange={setJobDescription}
            />
          </motion.div>
        )}

        {step === "analysis" && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <AnalysisResults
              resumeId={resumeId}
              jobDescription={jobDescription}
              tailoredResumeId={tailoredResumeId}
              analysisData={analysisData}
              onDownloadResume={handleDownloadResume}
              onGenerateCoverLetter={handleGenerateCoverLetter}
            />
          </motion.div>
        )}

        {step === "cover-letter" && (
          <motion.div
            key="cover-letter"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CoverLetterGenerator
              resumeId={resumeId}
              jobDescription={jobDescription}
              onClose={() => setStep("analysis")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
