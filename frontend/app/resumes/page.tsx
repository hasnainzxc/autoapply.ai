"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { TailoringProgress } from "@/components/ui/tailoring-progress";
import { ResumePreview } from "@/components/resume-preview";
import { ProfileForm, type ProfileData } from "@/components/profile-form";
import { apiGet, apiPostForm } from "@/lib/api-client";
import type { TailoredResumeSchema } from "@/lib/resume-to-html";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  X,
  Loader2,
  Zap,
  Target,
  BarChart3,
  Star,
  Award,
  Download,
  Wand2
} from "lucide-react";

interface Resume {
  id: string;
  original_file_path: string;
  extracted_text: string;
  created_at: string;
  name?: string;
  last_used?: string;
}

interface TailoredResume {
  id: string;
  job_description: string;
  status: string;
  pdf_path: string;
  created_at: string;
  ats_score?: number;
  matched_keywords?: string[];
  missing_keywords?: string[];
  template_used?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  ats_score: string;
  visually_striking: boolean;
}

interface TailoringResult {
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  ats_breakdown?: Record<string, number>;
  job_title?: string;
}

interface TailorV3Response {
  status: "success";
  tailored_resume_id: string;
  tailored_resume: TailoredResumeSchema;
  ats_analysis: {
    overall_score: number;
    breakdown: Record<string, number>;
    matched_keywords: string[];
    missing_keywords: string[];
    recommendations: string[];
  };
  match_score: {
    overall_score: number;
    keyword_match: number;
    experience_match: number;
    skills_gap: string[];
  };
}

function extractResumeName(filename: string): string {
  const nameWithoutExt = filename.replace(/\.(pdf|docx)$/i, '');
  const parts = nameWithoutExt.split(/[-_]/);
  if (parts.length >= 2) {
    const capitalized = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    return capitalized.join(' ');
  }
  return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);
}

function LastUsedIndicator({ resumeName }: { resumeName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mb-6"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-transparent rounded-2xl blur-xl" />
      
      <div className="relative bg-gradient-to-r from-green-900/40 via-emerald-900/30 to-green-900/20 border border-green-500/30 rounded-2xl p-4 sm:p-5 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" className="text-green-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-mono text-green-400 uppercase tracking-wider">Last Used Resume</span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white truncate">{resumeName}</h3>
            <p className="text-xs sm:text-sm text-green-400/80">Ready to use for applications</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 text-green-400/60">
            <span className="text-xs">Active</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

function ResumeCard({ 
  resume, 
  onSelect, 
  onDelete, 
  isSelected,
  isLastUsed 
}: { 
  resume: Resume; 
  onSelect: (id: string) => void; 
  onDelete: (id: string) => void;
  isSelected: boolean;
  isLastUsed: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const resumeName = resume.name || extractResumeName(resume.original_file_path);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(resume.id);
    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => onSelect(resume.id)}
      className={`
        group relative p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'bg-[#FACC15]/10 border-[#FACC15]/30' 
          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
        }
      `}
    >
      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FACC15]/5 to-transparent pointer-events-none" />
      )}
      
      {isLastUsed && (
        <div className="absolute -top-1 -right-3 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
          <span className="text-[10px] font-medium text-green-400">LAST USED</span>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isSelected ? 'bg-[#FACC15] text-black' : isLastUsed ? 'bg-green-500 text-black' : 'bg-white/10 text-[#6B6B6B]'}
        `}>
          {isLastUsed ? <Clock className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate text-sm sm:text-base">{resumeName}</h4>
          <p className="text-[10px] sm:text-xs text-[#6B6B6B] truncate">{resume.original_file_path}</p>
          <p className="text-[10px] sm:text-xs text-[#6B6B6B] mt-1">
            {new Date(resume.created_at).toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric', year: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isSelected ? (
            <div className="w-8 h-8 rounded-full bg-[#FACC15] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-black" />
            </div>
          ) : (
            <>
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-400" />
                )}
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full text-xs sm:text-sm bg-[#FACC15] text-black hover:bg-[#FACC15]/90"
                onClick={(e) => { e.stopPropagation(); onSelect(resume.id); }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isLastUsed && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  );
}

function TailoringResultCard({ result }: { result: TailoringResult }) {
  const scoreColor = result.ats_score >= 80 ? 'text-green-400' : result.ats_score >= 60 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-[#FACC15]/10 to-transparent border border-[#FACC15]/20 rounded-2xl p-4 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
            <Award className="w-6 h-6 text-[#FACC15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ATS Score</h3>
            <p className="text-xs text-[#6B6B6B]">Resume Optimization</p>
          </div>
        </div>
        <div className={`text-4xl font-bold ${scoreColor}`}>
          {result.ats_score}
          <span className="text-lg text-[#6B6B6B]">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Matched</span>
          </div>
          <p className="text-sm text-white font-medium">
            {result.matched_keywords?.slice(0, 5).join(', ')}
            {result.matched_keywords && result.matched_keywords.length > 5 && (
              <span className="text-[#6B6B6B]"> +{result.matched_keywords.length - 5} more</span>
            )}
          </p>
        </div>
        
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Missing</span>
          </div>
          <p className="text-sm text-white font-medium">
            {result.missing_keywords?.slice(0, 5).join(', ')}
            {result.missing_keywords && result.missing_keywords.length > 5 && (
              <span className="text-[#6B6B6B]"> +{result.missing_keywords.length - 5} more</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 px-6"
    >
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FACC15]/20 to-transparent rounded-2xl blur-xl" />
        <div className="relative w-full h-full bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
          <Upload className="w-10 h-10 text-[#6B6B6B]" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No resumes yet</h3>
      <p className="text-[#6B6B6B] max-w-sm mx-auto">
        Upload your first resume to start tailoring it for your target jobs
      </p>
    </motion.div>
  );
}

export default function ResumesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [lastUsedResume, setLastUsedResume] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [tailoringStep, setTailoringStep] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("modern_tech");
  const [tailoringResult, setTailoringResult] = useState<TailoringResult | null>(null);
  const [tailoredResumeData, setTailoredResumeData] = useState<TailoredResumeSchema | null>(null);
  const [inputMode, setInputMode] = useState<"upload" | "manual">("upload");
  const profileFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
    if (user) {
      fetchResumes();
      fetchTemplates();
    }
  }, [isLoaded, user, router]);

  const fetchResumes = async () => {
    try {
      const data = await apiGet<{ resumes: Resume[]; tailored: TailoredResume[] }>("/api/resumes");
      const resumeList = (data.resumes || []).map((r: Resume) => ({
        ...r,
        name: extractResumeName(r.original_file_path)
      }));
      setResumes(resumeList);
      setTailoredResumes(data.tailored || []);
      
      if (resumeList.length > 0 && !lastUsedResume) {
        setLastUsedResume(resumeList[0].id);
      }
    } catch (error) { console.error("Failed to fetch resumes", error); }
  };

  const fetchTemplates = async () => {
    try {
      const data = await apiGet<{ templates: Template[] }>("/api/resume/templates");
      setTemplates(data.templates || []);
    } catch (error) { console.error("Failed to fetch templates", error); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await apiPostForm<{ resume_id: string }>("/api/resume/upload", formData);
      const newResume: Resume = { 
        id: data.resume_id, 
        original_file_path: file.name, 
        extracted_text: "", 
        created_at: new Date().toISOString(),
        name: extractResumeName(file.name)
      };
      setResumes((prev) => [newResume, ...prev]);
      if (!lastUsedResume) setLastUsedResume(newResume.id);
    } catch (error) { console.error("Upload failed", error); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/resumes/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) {
        setResumes((prev) => prev.filter(r => r.id !== id));
        if (selectedResume === id) setSelectedResume(null);
        if (lastUsedResume === id) {
          const remaining = resumes.filter(r => r.id !== id);
          setLastUsedResume(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (error) { console.error("Delete failed", error); }
  };

  const handleSelectResume = (id: string) => {
    setSelectedResume(id);
    setLastUsedResume(id);
    setTailoringResult(null);
    setTailoredResumeData(null);
  };

  const simulateTailoringProgress = () => {
    setTailoringStep(1);
    setTimeout(() => setTailoringStep(2), 1500);
    setTimeout(() => setTailoringStep(3), 3000);
    setTimeout(() => setTailoringStep(4), 4500);
  };

  const handleTailor = async () => {
    if (!selectedResume || !jobDescription.trim()) return;
    setTailoring(true);
    setTailoringResult(null);
    setTailoredResumeData(null);
    simulateTailoringProgress();
    
    try {
      const formData = new FormData();
      formData.append("resume_id", selectedResume);
      formData.append("job_description", jobDescription);
      formData.append("template", selectedTemplate);
      const data = await apiPostForm<TailorV3Response>("/api/resume/tailor-v3", formData);
      setTailoredResumes((prev) => [{ 
        id: data.tailored_resume_id, 
        job_description: jobDescription, 
        status: "completed", 
        pdf_path: "", 
        created_at: new Date().toISOString(),
        ats_score: data.ats_analysis.overall_score,
        matched_keywords: data.ats_analysis.matched_keywords,
        missing_keywords: data.ats_analysis.missing_keywords,
        template_used: selectedTemplate
      }, ...prev]);
      setTailoringResult({
        ats_score: data.ats_analysis.overall_score,
        matched_keywords: data.ats_analysis.matched_keywords,
        missing_keywords: data.ats_analysis.missing_keywords,
        ats_breakdown: data.ats_analysis.breakdown,
        job_title: data.tailored_resume.basics?.name
      });
      setTailoredResumeData(data.tailored_resume);
      setJobDescription("");
    } catch (error) { console.error("Tailoring failed", error); }
    finally { 
      setTailoring(false);
      setTailoringStep(0);
    }
  };

  const handleProfileSubmit = async (profileData: ProfileData) => {
    if (!jobDescription.trim()) return;
    setTailoring(true);
    setTailoringResult(null);
    setTailoredResumeData(null);
    simulateTailoringProgress();

    try {
      const formData = new FormData();
      formData.append("profile_data", JSON.stringify(profileData));
      formData.append("job_description", jobDescription);
      formData.append("template", selectedTemplate);
      const data = await apiPostForm<TailorV3Response>("/api/resume/tailor-v3", formData);
      setTailoredResumes((prev) => [{
        id: data.tailored_resume_id,
        job_description: jobDescription,
        status: "completed",
        pdf_path: "",
        created_at: new Date().toISOString(),
        ats_score: data.ats_analysis.overall_score,
        matched_keywords: data.ats_analysis.matched_keywords,
        missing_keywords: data.ats_analysis.missing_keywords,
        template_used: selectedTemplate
      }, ...prev]);
      setTailoringResult({
        ats_score: data.ats_analysis.overall_score,
        matched_keywords: data.ats_analysis.matched_keywords,
        missing_keywords: data.ats_analysis.missing_keywords,
        ats_breakdown: data.ats_analysis.breakdown,
        job_title: data.tailored_resume.basics?.name
      });
      setTailoredResumeData(data.tailored_resume);
      setJobDescription("");
    } catch (error) { console.error("Tailoring failed", error); }
    finally {
      setTailoring(false);
      setTailoringStep(0);
    }
  };

  const downloadPDF = (url: string) => { 
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.open(`${apiUrl}${url}`, "_blank"); 
  };

  const lastUsedResumeName = resumes.find(r => r.id === lastUsedResume)?.name || 
    (resumes.find(r => r.id === lastUsedResume) ? extractResumeName(resumes.find(r => r.id === lastUsedResume)!.original_file_path) : null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FACC15]/30 border-t-[#FACC15] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#FACC15]/5 rounded-full blur-[200px]" />
      </div>
      <div className="pt-24 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Resumes</h1>
            <p className="text-[#6B6B6B] mt-1 text-sm sm:text-base">Upload, manage, and tailor your resumes</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-[#6B6B6B]">{resumes.length} resume{resumes.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <AnimatePresence>
          {lastUsedResumeName && (
            <LastUsedIndicator resumeName={lastUsedResumeName} />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-6">
            {/* Input Mode Toggle */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                onClick={() => { setInputMode("upload"); setTailoringResult(null); setTailoredResumeData(null); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  inputMode === "upload"
                    ? "bg-[#FACC15] text-black shadow-lg"
                    : "text-[#6B6B6B] hover:text-white"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </span>
              </button>
              <button
                onClick={() => { setInputMode("manual"); setSelectedResume(null); setTailoringResult(null); setTailoredResumeData(null); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  inputMode === "manual"
                    ? "bg-[#FACC15] text-black shadow-lg"
                    : "text-[#6B6B6B] hover:text-white"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Enter Details
                </span>
              </button>
            </div>

            {inputMode === "upload" ? (
              <>
            <GlassCard className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#FACC15]" />
                </div>
                <h2 className="text-lg font-semibold text-white">Upload Resume</h2>
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`
                  border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300
                  ${uploading 
                    ? 'border-[#FACC15]/50 bg-[#FACC15]/5' 
                    : 'border-white/10 hover:border-[#FACC15]/50 hover:bg-white/5'
                  }
                `}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-[#FACC15] animate-spin mb-3" />
                    <p className="text-white font-medium">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-[#6B6B6B]" />
                    </div>
                    <p className="text-white font-medium mb-1">Drop your resume here</p>
                    <p className="text-[#6B6B6B] text-sm">PDF or DOCX • Max 10MB</p>
                  </>
                )}
              </div>
            </GlassCard>
              </>
            ) : (
              <ProfileForm innerRef={profileFormRef} onSubmit={handleProfileSubmit} isLoading={tailoring} />
            )}

            {(inputMode === "upload" ? resumes.length > 0 : true) && (
              <GlassCard className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Tailor Resume</h2>
                </div>
                
                <AnimatePresence>
                  {tailoring && tailoringStep > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-black/20 rounded-xl border border-white/5"
                    >
                      <TailoringProgress 
                        currentStep={tailoringStep} 
                        jobTitle={jobDescription.slice(0, 30)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {inputMode === "upload" && (
                  <div>
                    <label className="text-[#6B6B6B] text-sm mb-2 block">Select Resume</label>
                    <select 
                      value={selectedResume || ""} 
                      onChange={(e) => handleSelectResume(e.target.value)} 
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FACC15] text-sm"
                    >
                      <option value="">Choose a resume...</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id} className="bg-[#1A1A1A]">
                          {r.name} ({r.original_file_path})
                        </option>
                      ))}
                    </select>
                  </div>
                  )}
                  
                  {templates.length > 0 && (
                    <div>
                      <label className="text-[#6B6B6B] text-sm mb-2 block">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-[#FACC15]" />
                          Template
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {templates.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`
                              p-3 rounded-xl border text-left transition-all duration-200
                              ${selectedTemplate === t.id 
                                ? 'bg-[#FACC15]/10 border-[#FACC15]/30' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                              }
                            `}
                          >
                            <p className="text-white text-sm font-medium">{t.name}</p>
                            <p className="text-[#6B6B6B] text-xs mt-1">{t.ats_score} ATS</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-[#6B6B6B] text-sm mb-2 block">
                      <span className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-purple-400" />
                        Job Description
                      </span>
                    </label>
                    <textarea 
                      value={jobDescription} 
                      onChange={(e) => setJobDescription(e.target.value)} 
                      placeholder="Paste the job description here..." 
                      rows={5}
                      disabled={tailoring}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FACC15] resize-none text-sm disabled:opacity50" 
                    />
                  </div>
                  
                  <Button 
                    onClick={inputMode === "upload" ? handleTailor : () => profileFormRef.current?.requestSubmit()} 
                    disabled={
                      inputMode === "upload" 
                        ? (!selectedResume || !jobDescription.trim() || tailoring)
                        : (!jobDescription.trim() || tailoring)
                    } 
                    className="w-full rounded-xl bg-[#FACC15] text-black hover:bg-[#FACC15]/90 font-medium h-12"
                  >
                    {tailoring ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Tailoring...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Generate Tailored Resume
                      </span>
                    )}
                  </Button>
                </div>
              </GlassCard>
            )}

            <AnimatePresence>
              {tailoringResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TailoringResultCard result={tailoringResult} />
                </motion.div>
              )}
              {tailoredResumeData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <GlassCard className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#FACC15]/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#FACC15]" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Tailored Resume Preview</h2>
                    </div>
                    <div className="min-h-[500px]">
                      <ResumePreview resumeData={tailoredResumeData} />
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            {resumes.length === 0 ? (
              <EmptyState />
            ) : (
              <GlassCard className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Your Resumes</h2>
                  </div>
                  <span className="text-xs text-[#6B6B6B] px-2 py-1 bg-white/5 rounded-full">{resumes.length}</span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {resumes.map((resume) => (
                      <ResumeCard
                        key={resume.id}
                        resume={resume}
                        onSelect={handleSelectResume}
                        onDelete={handleDelete}
                        isSelected={selectedResume === resume.id}
                        isLastUsed={lastUsedResume === resume.id}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </GlassCard>
            )}

            {tailoredResumes && tailoredResumes.length > 0 && (
              <GlassCard className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Tailored Versions</h2>
                </div>
                <div className="space-y-3">
                  {tailoredResumes.map((resume, index) => (
                    <motion.div 
                      key={resume.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{resume.job_description.slice(0, 40)}...</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-[#6B6B6B]">
                              {new Date(resume.created_at).toLocaleDateString()}
                            </span>
                            {resume.ats_score && (
                              <span className={`
                                text-[10px] px-1.5 py-0.5 rounded-full
                                ${resume.ats_score >= 80 ? 'bg-green-500/20 text-green-400' : 
                                  resume.ats_score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-red-500/20 text-red-400'}
                              `}>
                                {resume.ats_score}/100
                              </span>
                            )}
                            {resume.template_used && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                {resume.template_used}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="rounded-xl bg-green-500 text-black hover:bg-green-400 flex-shrink-0 text-xs sm:text-sm"
                        onClick={() => downloadPDF(`/api/resume/${resume.id}/download`)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}