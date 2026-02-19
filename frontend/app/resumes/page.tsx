"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";

interface Resume {
  id: string;
  original_file_path: string;
  extracted_text: string;
  created_at: string;
}

interface TailoredResume {
  id: string;
  job_description: string;
  status: string;
  pdf_path: string;
  created_at: string;
}

export default function ResumesPage() {
  const { user, isLoaded } = useUser();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/resumes");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
        setTailoredResumes(data.tailored || []);
      }
    } catch (error) {
      console.error("Failed to fetch resumes", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResumes((prev) => [
          {
            id: data.resume_id,
            original_file_path: file.name,
            extracted_text: "",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const handleTailor = async () => {
    if (!selectedResume || !jobDescription.trim()) return;

    setTailoring(true);
    try {
      const formData = new FormData();
      formData.append("resume_id", selectedResume);
      formData.append("job_description", jobDescription);

      const res = await fetch("http://localhost:8000/api/resume/tailor", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setTailoredResumes((prev) => [
          {
            id: data.tailored_resume_id,
            job_description: jobDescription,
            status: "completed",
            pdf_path: data.pdf_path,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setJobDescription("");
        setSelectedResume(null);
      }
    } catch (error) {
      console.error("Tailoring failed", error);
    } finally {
      setTailoring(false);
    }
  };

  const downloadPDF = (url: string) => {
    window.open(`http://localhost:8000${url}`, "_blank");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">My Resumes</h1>
            <p className="text-zinc-500 mt-1">Upload and manage your resumes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-white mb-4">Upload Resume</h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-xl p-8 text-center cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleUpload}
                  className="hidden"
                />
                {uploading ? (
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-zinc-400 mb-2">Click to upload PDF or DOCX</p>
                    <p className="text-zinc-600 text-sm">Max 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Tailor Section */}
            {resumes.length > 0 && (
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">Tailor Resume</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-400 text-sm mb-2 block">Select Resume</label>
                    <select
                      value={selectedResume || ""}
                      onChange={(e) => setSelectedResume(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Choose a resume...</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.original_file_path}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-2 block">Job Description</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows={4}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleTailor}
                    disabled={!selectedResume || !jobDescription.trim() || tailoring}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tailoring ? "Generating..." : "Generate Tailored Resume"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resumes List */}
          <div className="space-y-6">
            {resumes.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center">
                <svg className="w-16 h-16 text-zinc-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">No resumes yet</h3>
                <p className="text-zinc-500">Upload your first resume to get started</p>
              </div>
            ) : (
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">Your Resumes</h2>
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{resume.original_file_path}</p>
                          <p className="text-zinc-500 text-sm">
                            {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedResume(resume.id)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-all"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tailored Resumes */}
            {tailoredResumes && (
              <div className=".length > 0glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">Tailored Versions</h2>
                <div className="space-y-3">
                  {tailoredResumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium truncate max-w-[200px]">
                            {resume.job_description.slice(0, 30)}...
                          </p>
                          <p className="text-zinc-500 text-sm">
                            {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadPDF(`/api/resume/${resume.id}/download`)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
