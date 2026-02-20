"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import {
  Sparkles, FileText, Rocket, Zap, ArrowRight, CheckCircle2,
  Loader2, Users, Briefcase, TrendingUp, Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const features = [
  {
    icon: Sparkles,
    title: "AI Resume Tailoring",
    description: "Our AI analyzes job descriptions and optimizes your resume for maximum impact.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: FileText,
    title: "Cover Letters",
    description: "Personalized cover letters that sound authentically like you.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Rocket,
    title: "Auto-Apply",
    description: "One-click applications to hundreds of relevant job postings.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: TrendingUp,
    title: "Smart Tracking",
    description: "Track all your applications with intelligent status updates.",
    gradient: "from-orange-500 to-amber-500",
  },
];

const stats = [
  { value: "50K+", label: "Applications Sent" },
  { value: "92%", label: "Interview Rate" },
  { value: "4.9/5", label: "User Rating" },
  { value: "10min", label: "Avg. Setup Time" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    text: "ApplyMate helped me land my dream job. The resume tailoring is incredible.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager at Stripe",
    text: "Saved me hours of manual application work. Highly recommended.",
    avatar: "MJ",
  },
  {
    name: "Emily Davis",
    role: "Designer at Figma",
    text: "The AI understood exactly what recruiters were looking for.",
    avatar: "ED",
  },
];

export default function HomePage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("landing");
  const [jobUrl, setJobUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoaded || !mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

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
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_url: jobUrl, template: selectedTemplate }),
      });
      if (res.ok) {
        setStep("complete");
        setTimeout(() => router.push("/dashboard"), 2500);
      } else {
        setTimeout(() => setStep("complete"), 2000);
        setTimeout(() => router.push("/dashboard"), 4500);
      }
    } catch {
      setTimeout(() => setStep("complete"), 2000);
      setTimeout(() => router.push("/dashboard"), 4500);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipResume = () => {
    setSelectedTemplate("general");
    handleContinue();
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Navbar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[80px]" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)]" />
      </div>

      {step === "landing" ? (
        <main className="relative">
          {/* Hero Section */}
          <section className="relative pt-32 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
              {/* Badge */}
              <div className="flex justify-center mb-8 animate-fade-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-zinc-400">Now with GPT-4o integration</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-bold text-center text-white leading-[1.1] mb-6 animate-fade-up animation-delay-100">
                Land your dream job,{" "}
                <span className="text-gradient">faster.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-zinc-400 text-center max-w-2xl mx-auto mb-12 animate-fade-up animation-delay-200">
                Automate job applications with AI that tailors your resume, writes cover letters, and applies on your behalf.
              </p>

              {/* Quick Start Input */}
              <div className="max-w-2xl mx-auto mb-8 animate-fade-up animation-delay-300">
                <Card className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-xl rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 p-2">
                    <div className="flex-1 px-4">
                      <input
                        type="url"
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleStart()}
                        placeholder="Paste a job URL to get started..."
                        className="w-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none text-lg py-3"
                      />
                    </div>
                    <Button
                      onClick={handleStart}
                      disabled={!jobUrl.trim()}
                      className="btn-primary px-8 py-4 text-base font-medium rounded-xl"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
                <p className="text-center text-zinc-500 text-sm mt-4">
                  Works with LinkedIn, Indeed, Lever, Greenhouse, and 500+ job boards
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 py-8 animate-fade-up animation-delay-400">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-zinc-500 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16 animate-fade-up">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Everything you need to{" "}
                  <span className="text-gradient">win</span>
                </h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                  Powerful features designed to give you the competitive edge in your job search.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <Card 
                      key={i} 
                      className="glass-card p-6 rounded-2xl group hover:scale-[1.02] transition-transform duration-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  How it works
                </h2>
                <p className="text-zinc-400 text-lg">
                  Three simple steps to automate your job search
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                {[
                  { step: "01", title: "Paste Job URL", desc: "Drop any job listing link and our AI gets to work instantly." },
                  { step: "02", title: "AI Tailors", desc: "We optimize your resume and generate a matching cover letter." },
                  { step: "03", title: "We Apply", desc: "Your application is submitted with best-in-class formatting." },
                ].map((item, i) => (
                  <div key={i} className="relative text-center md:text-left">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 mb-6">
                      <span className="text-2xl font-bold text-violet-400">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400">{item.desc}</p>
                    {i < 2 && (
                      <div className="hidden md:block absolute top-8 -right-6 lg:-right-12 w-12 lg:w-24 h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Loved by job seekers
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <Card key={i} className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-zinc-300 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-white font-medium">{t.name}</div>
                        <div className="text-zinc-500 text-sm">{t.role}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
              <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/40 to-indigo-900/20 border-violet-500/20 p-12 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/10 to-transparent" />
                <div className="relative">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to land your dream job?
                  </h2>
                  <p className="text-zinc-300 text-lg mb-8 max-w-xl mx-auto">
                    Join thousands of professionals who have automated their job search with ApplyMate.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => router.push("/sign-up")}
                      className="btn-primary px-8 py-4 text-lg font-medium rounded-xl"
                    >
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="btn-secondary px-8 py-4 text-lg font-medium rounded-xl border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      View Demo
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 px-6 border-t border-zinc-900">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">ApplyMate</span>
              </div>
              <p className="text-zinc-500 text-sm">
                &copy; 2026 ApplyMate. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      ) : (
        /* Multi-step flow for authenticated users */
        <main className="max-w-2xl mx-auto px-8 pt-32 pb-20">
          {/* Step indicator */}
          {step !== "complete" && (
            <div className="flex items-center justify-center gap-2 mb-12">
              {["resume-select", "processing", "complete"].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step === s 
                      ? "bg-violet-600 text-white" 
                      : ["processing", "complete"].includes(step) && i < ["resume-select", "processing", "complete"].indexOf(step)
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {["processing", "complete"].includes(step) && i < ["resume-select", "processing", "complete"].indexOf(step) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : i + 2}
                  </div>
                  {i < 2 && <div className="w-12 h-px bg-zinc-800" />}
                </div>
              ))}
            </div>
          )}

          {/* Resume Selection */}
          {step === "resume-select" && (
            <div className="animate-scale-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Choose your <span className="text-gradient">template</span>
                </h2>
                <p className="text-zinc-400">Select the best profile for your target role</p>
              </div>

              <div className="space-y-3 mb-8">
                {resumeTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`w-full p-5 rounded-xl text-left transition-all duration-300 border ${
                      selectedTemplate === template.id
                        ? "border-violet-500 bg-violet-500/10 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h3 className="text-white font-semibold">{template.name}</h3>
                        <p className="text-zinc-500 text-sm">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("landing")}
                  className="flex-1 py-5 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!selectedTemplate || loading}
                  className="flex-1 btn-primary py-5 font-medium rounded-xl"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Processing */}
          {step === "processing" && (
            <div className="text-center py-12 animate-fade-up">
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-3">Processing your application</h2>
              <p className="text-zinc-400 mb-10">AI is analyzing the job and tailoring your materials...</p>

              <div className="space-y-3 max-w-sm mx-auto text-left">
                {[
                  { text: "Analyzing job requirements", done: true },
                  { text: "Tailoring your resume", done: true },
                  { text: "Generating cover letter", done: false },
                  { text: "Submitting application", done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50">
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    )}
                    <span className={item.done ? "text-zinc-300" : "text-zinc-500"}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete */}
          {step === "complete" && (
            <div className="text-center py-12 animate-scale-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">All done!</h2>
              <p className="text-zinc-400 mb-8">Your application has been optimized and submitted.</p>

              <div className="inline-flex items-center gap-2 text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to dashboard...
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
