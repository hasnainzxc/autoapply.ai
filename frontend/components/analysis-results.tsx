"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Mail, 
  Sparkles,
  TrendingUp,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisResultsProps {
  resumeId: string;
  jobDescription: string;
  tailoredResumeId: string;
  analysisData: any;
  onDownloadResume: () => void;
  onGenerateCoverLetter: () => void;
}

export function AnalysisResults({ 
  resumeId, 
  jobDescription,
  tailoredResumeId,
  analysisData,
  onDownloadResume, 
  onGenerateCoverLetter 
}: AnalysisResultsProps) {
  const atsScore = analysisData?.atsScore || 78;
  
  const matchedSkills = analysisData?.matchedSkills || [];
  const missingSkills = analysisData?.missingSkills || [];
  const suggestions = analysisData?.suggestions || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500/20 to-green-500/5";
    if (score >= 60) return "from-yellow-500/20 to-yellow-500/5";
    return "from-red-500/20 to-red-500/5";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#FACC15]/20 to-[#FACC15]/5 mb-4">
          <Sparkles className="w-10 h-10 text-[#FACC15]" />
        </div>
        <h2 className="text-2xl font-bold text-[#E4E2DD]">Analysis Complete!</h2>
        <p className="text-[#6B6B6B] mt-2">Here&apos;s how your resume matches this job</p>
      </div>

      <div className={`bg-gradient-to-br ${getScoreBg(atsScore)} rounded-2xl border border-white/10 p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#6B6B6B] text-sm mb-1">ATS Compatibility Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(atsScore)}`}>
              {atsScore}
              <span className="text-2xl text-[#6B6B6B]">/100</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Good match</span>
            </div>
            <p className="text-[#6B6B6B] text-sm mt-1">
              {matchedSkills.length} skills aligned
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${atsScore}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full rounded-full ${
              atsScore >= 80 ? "bg-green-500" : atsScore >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-[#E4E2DD] font-medium">Matched Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-[#E4E2DD] font-medium">Missing Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#FACC15]" />
          <h3 className="text-[#E4E2DD] font-medium">Optimization Suggestions</h3>
        </div>
        <ul className="space-y-3">
          {suggestions.map((suggestion, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 text-[#6B6B6B]"
            >
              <AlertTriangle className="w-4 h-4 text-[#FACC15] mt-0.5 flex-shrink-0" />
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <Button 
          onClick={onDownloadResume}
          className="rounded-full bg-[#FACC15] text-black hover:bg-[#FACC15]/90 px-8"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Optimized Resume
        </Button>
        <Button 
          onClick={onGenerateCoverLetter}
          variant="outline"
          className="rounded-full border-white/20 text-[#E4E2DD] hover:bg-white/5 px-8"
        >
          <Mail className="w-5 h-5 mr-2" />
          Generate Cover Letter
        </Button>
      </div>
    </motion.div>
  );
}
