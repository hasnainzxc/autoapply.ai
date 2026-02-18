"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";

type Step = "landing" | "job-input" | "resume-select" | "processing" | "complete";

const resumeTemplates = [
  {
    id: "tech",
    name: "Tech Professional",
    description: "Software Engineer, Data Scientist, DevOps",
    icon: "💻",
  },
  {
    id: "design",
    name: "Creative Designer",
    description: "UI/UX, Product Designer, Graphic Designer",
    icon: "🎨",
  },
  {
    id: "business",
    name: "Business Pro",
    description: "Product Manager, Analyst, Consultant",
    icon: "📊",
  },
  {
    id: "general",
    name: "General",
    description: "Any other role or industry",
    icon: "📄",
  },
];

export default function HomePage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("landing");
  const [jobUrl, setJobUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    if (!jobUrl.trim()) return;
    setStep("resume-select");
  };

  const handleContinue = async () => {
    if (!selectedTemplate) return;
    
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setStep("processing");
    
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          job_url: jobUrl,
          template: selectedTemplate 
        }),
      });
      
      if (res.ok) {
        setStep("complete");
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (error) {
      console.error("Failed to add job", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipResume = () => {
    setSelectedTemplate("general");
    handleContinue();
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden bg-pattern">
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">ApplyMate</span>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4 animate-slide-up">
            <button
              onClick={() => router.push("/")}
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Dashboard
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 animate-slide-up">
            <a
              href="/sign-in"
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all btn-glow"
            >
              Get Started
            </a>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 pt-12 pb-20">
        {/* Step indicator */}
        {step !== "landing" && step !== "complete" && (
          <div className="flex items-center justify-center gap-4 mb-12 animate-scale-in">
            {["landing", "job-input", "resume-select", "processing"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s || (step === "resume-select" && s === "job-input") || (step === "processing" && i < 3)
                    ? "bg-purple-600 text-white" 
                    : "bg-zinc-800 text-zinc-500"
                }`}>
                  {i + 1}
                </div>
                {i < 3 && <div className={`w-12 h-px ${step !== "landing" ? "bg-purple-600" : "bg-zinc-800"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Landing Step */}
        {step === "landing" && (
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-semibold text-white tracking-tight mb-6 animate-slide-up">
              Automate your job{" "}
              <span className="gradient-text">applications</span>
            </h1>
            <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto animate-slide-up-delay-1">
              Let AI tailor your resume, write cover letters, and apply to jobs automatically. 
              Just paste a job link and let us handle the rest.
            </p>

            {/* Quick start */}
            <div className="max-w-2xl mx-auto mb-16 animate-slide-up-delay-2">
              <div className="glass-card p-3 rounded-2xl flex items-center gap-3">
                <div className="flex-1 px-4">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    placeholder="Paste any job listing URL..."
                    className="w-full bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-lg py-2 input-glow transition-all"
                  />
                </div>
                <button
                  onClick={handleStart}
                  disabled={!jobUrl.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
                >
                  Start
                </button>
              </div>
              <p className="text-zinc-600 text-sm mt-4">
                Works with LinkedIn, Indeed, Lever, Greenhouse, and more
              </p>
            </div>

            {/* Features preview */}
            <div className="grid md:grid-cols-3 gap-6 animate-slide-up-delay-3">
              <div className="glass-card p-6 rounded-2xl text-left card-lift feature-card">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Resume Tailoring</h3>
                <p className="text-zinc-500 text-sm">AI optimizes your resume for each job description.</p>
              </div>
              
              <div className="glass-card p-6 rounded-2xl text-left card-lift feature-card">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Cover Letter Generator</h3>
                <p className="text-zinc-500 text-sm">Personalized cover letters in your voice.</p>
              </div>
              
              <div className="glass-card p-6 rounded-2xl text-left card-lift feature-card">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Auto-Apply</h3>
                <p className="text-zinc-500 text-sm">Automated form filling and submission.</p>
              </div>
            </div>
          </div>
        )}

        {/* Job URL Confirmed */}
        {step === "job-input" && (
          <div className="text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Job Found!</h2>
            <p className="text-zinc-500 mb-8">{jobUrl}</p>
            
            <button
              onClick={() => setStep("resume-select")}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all btn-glow"
            >
              Continue
            </button>
          </div>
        )}

        {/* Resume Template Selection */}
        {step === "resume-select" && (
          <div className="animate-scale-in">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-semibold text-white mb-3">
                Choose your <span className="gradient-text">template</span>
              </h2>
              <p className="text-zinc-500">Select the best fit for your target role</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {resumeTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`glass-card p-6 rounded-2xl text-left transition-all ${
                    selectedTemplate === template.id 
                      ? "ring-2 ring-purple-500 bg-purple-500/5" 
                      : "hover:border-purple-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                      <p className="text-zinc-500 text-sm">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleSkipResume}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium rounded-xl transition-all"
              >
                Skip for now
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedTemplate || loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
              >
                {loading ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="text-center py-20 animate-scale-in">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-pulse-ring" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-3">Processing your application</h2>
            <p className="text-zinc-500 mb-6">AI is analyzing the job and tailoring your resume...</p>
            
            <div className="max-w-md mx-auto space-y-3">
              <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0s' }}>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-zinc-300">Scraping job description</span>
              </div>
              <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-zinc-300">Tailoring your resume</span>
              </div>
              <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-zinc-300">Generating cover letter</span>
              </div>
              <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.9s' }}>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-zinc-500">Preparing application</span>
              </div>
            </div>
          </div>
        )}

        {/* Complete */}
        {step === "complete" && (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-8 animate-float">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-semibold text-white mb-3">All Done!</h2>
            <p className="text-zinc-500 mb-8">Your application has been submitted successfully.</p>
            
            <p className="text-zinc-600">Redirecting to dashboard...</p>
          </div>
        )}
      </main>
    </div>
  );
}
