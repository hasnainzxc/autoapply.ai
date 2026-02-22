"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Upload, 
  FileText, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  X,
  Loader2
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
            <svg className="absolute -bottom-2 -left-2 w-6 h-6" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M2 12 C 8 8, 12 16, 22 12"
                stroke="url(#grad1)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
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
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(resume.id);
    setIsDeleting(false);
  };
  
  const resumeName = resume.name || extractResumeName(resume.original_file_path);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => onSelect(resume.id)}
      className={`
        group relative p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'bg-[#FACC15]/10 border-[#FACC15]/50 shadow-[0_0_20px_-5px_rgba(250,204,21,0.3)]' 
          : isLastUsed
            ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40 hover:bg-green-500/10'
            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
        }
      `}
    >
      {isLastUsed && (
        <div className="absolute -top-2 -right-2 sm:-right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-black text-[10px] font-bold rounded-full">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">LAST USED</span>
            <span className="sm:hidden">USED</span>
          </div>
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
                Use
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
    if (user) fetchResumes();
  }, [isLoaded, user, router]);

  const fetchResumes = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/resumes");
      if (res.ok) {
        const data = await res.json();
        const resumeList = (data.resumes || []).map((r: Resume) => ({
          ...r,
          name: extractResumeName(r.original_file_path)
        }));
        setResumes(resumeList);
        setTailoredResumes(data.tailored || []);
        
        if (resumeList.length > 0 && !lastUsedResume) {
          setLastUsedResume(resumeList[0].id);
        }
      }
    } catch (error) { console.error("Failed to fetch resumes", error); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/api/resume/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        const newResume: Resume = { 
          id: data.resume_id, 
          original_file_path: file.name, 
          extracted_text: "", 
          created_at: new Date().toISOString(),
          name: extractResumeName(file.name)
        };
        setResumes((prev) => [newResume, ...prev]);
        if (!lastUsedResume) setLastUsedResume(newResume.id);
      }
    } catch (error) { console.error("Upload failed", error); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/resumes/${id}`, { method: "DELETE" });
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
  };

  const handleTailor = async () => {
    if (!selectedResume || !jobDescription.trim()) return;
    setTailoring(true);
    try {
      const formData = new FormData();
      formData.append("resume_id", selectedResume);
      formData.append("job_description", jobDescription);
      const res = await fetch("http://localhost:8000/api/resume/tailor", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setTailoredResumes((prev) => [{ id: data.tailored_resume_id, job_description: jobDescription, status: "completed", pdf_path: data.pdf_path, created_at: new Date().toISOString() }, ...prev]);
        setJobDescription("");
      }
    } catch (error) { console.error("Tailoring failed", error); }
    finally { setTailoring(false); }
  };

  const downloadPDF = (url: string) => { window.open(`http://localhost:8000${url}`, "_blank"); };

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

            {resumes.length > 0 && (
              <GlassCard className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Tailor Resume</h2>
                </div>
                <div className="space-y-4">
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
                  <div>
                    <label className="text-[#6B6B6B] text-sm mb-2 block">Job Description</label>
                    <textarea 
                      value={jobDescription} 
                      onChange={(e) => setJobDescription(e.target.value)} 
                      placeholder="Paste the job description here..." 
                      rows={4} 
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FACC15] resize-none text-sm" 
                    />
                  </div>
                  <Button 
                    onClick={handleTailor} 
                    disabled={!selectedResume || !jobDescription.trim() || tailoring} 
                    className="w-full rounded-xl bg-[#FACC15] text-black hover:bg-[#FACC15]/90 font-medium"
                  >
                    {tailoring ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      "Generate Tailored Resume"
                    )}
                  </Button>
                </div>
              </GlassCard>
            )}
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
                  {tailoredResumes.map((resume) => (
                    <div 
                      key={resume.id} 
                      className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{resume.job_description.slice(0, 40)}...</p>
                          <p className="text-[10px] sm:text-xs text-[#6B6B6B]">
                            {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="rounded-xl bg-green-500 text-black hover:bg-green-400 flex-shrink-0 text-xs sm:text-sm"
                        onClick={() => downloadPDF(`/api/resume/${resume.id}/download`)}
                      >
                        Download
                      </Button>
                    </div>
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
