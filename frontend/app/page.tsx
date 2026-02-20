"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles, FileText, Rocket, Zap, ArrowRight, CheckCircle2,
  Loader2, TrendingUp, Star, Shield, Award, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Navbar } from "@/components/navbar";

type Step = "landing" | "job-input" | "resume-select" | "processing" | "complete";

const resumeTemplates = [
  { id: "tech", name: "Tech Professional", description: "Software Engineer, Data Scientist, DevOps", icon: "💻" },
  { id: "design", name: "Creative Designer", description: "UI/UX, Product Designer, Graphic Designer", icon: "🎨" },
  { id: "business", name: "Business Pro", description: "Product Manager, Analyst, Consultant", icon: "📊" },
  { id: "general", name: "General", description: "Any other role or industry", icon: "📄" },
];

const features = [
  { icon: Sparkles, title: "AI Resume Tailoring", description: "Our AI analyzes job descriptions and optimizes your resume for maximum impact." },
  { icon: FileText, title: "Cover Letters", description: "Personalized cover letters that sound authentically like you." },
  { icon: Rocket, title: "Auto-Apply", description: "One-click applications to hundreds of relevant job postings." },
  { icon: TrendingUp, title: "Smart Tracking", description: "Track all your applications with intelligent status updates." },
];

const stats = [
  { value: "50K+", label: "Applications Sent" },
  { value: "92%", label: "Interview Rate" },
  { value: "4.9/5", label: "User Rating" },
  { value: "10min", label: "Avg. Setup Time" },
];

const testimonials = [
  { name: "Sarah Chen", role: "Software Engineer at Google", text: "ApplyMate helped me land my dream job. The resume tailoring is incredible.", avatar: "SC" },
  { name: "Marcus Johnson", role: "Product Manager at Stripe", text: "Saved me hours of manual application work. Highly recommended.", avatar: "MJ" },
  { name: "Emily Davis", role: "Designer at Figma", text: "The AI understood exactly what recruiters were looking for.", avatar: "ED" },
];

const partners = ["dbt", "Tableau", "Snowflake", "Fivetran", "Databricks"];

function LiquidHero() {
  return (
    <section className="relative bg-cyber-yellow overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-black/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-black/10 rounded-full blur-2xl animate-float animation-delay-300" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-black/15 rounded-full blur-xl animate-float animation-delay-500" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-onyx" style={{ clipPath: 'ellipse(150% 100% at 50% 0%)' }} />
      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-48">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 backdrop-blur-sm mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-black/60 animate-pulse" />
              <span className="text-sm text-black/70 font-medium">Now with GPT-4o integration</span>
            </div>
            <h1 className="hero-headline text-black mb-6 animate-liquid-in">
              Land your dream job,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-black/60 to-black/40">faster.</span>
            </h1>
            <p className="sub-header text-black/70 max-w-xl mb-10 animate-liquid-in animation-delay-200">
              Automate job applications with AI that tailors your resume, writes cover letters, and applies on your behalf.
            </p>
            <div className="flex flex-wrap gap-4 animate-liquid-in animation-delay-300">
              <Button size="xl" variant="solid" onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}>
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="xl" variant="pillOutline">View Demo</Button>
            </div>
            <div className="flex flex-wrap justify-start gap-8 md:gap-16 mt-16 animate-liquid-in animation-delay-400">
              {stats.map((stat, i) => (
                <div key={i} className="text-left">
                  <div className="text-3xl md:text-4xl font-bold text-black mb-1">{stat.value}</div>
                  <div className="text-black/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square">
              <div className="absolute top-10 right-10 w-40 h-40 bg-white/20 backdrop-blur-sm rounded-[32px] animate-float" />
              <div className="absolute top-1/3 right-20 w-32 h-32 bg-black/10 backdrop-blur-sm rounded-full animate-float animation-delay-200" />
              <div className="absolute bottom-20 right-0 w-48 h-48 bg-white/10 backdrop-blur-sm rounded-[40px] animate-float animation-delay-400" />
              <div className="absolute top-1/2 left-10 w-24 h-24 bg-black/15 backdrop-blur-sm rounded-2xl animate-float animation-delay-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GetStartedSection() {
  return (
    <section id="get-started" className="py-24 px-6 bg-cyber-yellow relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
      </div>
      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 tracking-tight">Get started in seconds</h2>
        <p className="text-black/70 text-lg mb-10">Paste any job URL and let our AI handle the rest.</p>
        <GlassCard className="p-2 max-w-xl mx-auto" variant="pill">
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4">
              <input type="url" placeholder="Paste a job URL to get started..." className="w-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none text-lg py-4" />
            </div>
            <Button size="lg" variant="solid" className="rounded-full">Start <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </GlassCard>
        <p className="text-black/50 text-sm mt-6">Works with LinkedIn, Indeed, Lever, Greenhouse, and 500+ job boards</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-onyx" style={{ clipPath: 'ellipse(150% 100% at 50% 0%)' }} />
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-onyx relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <span className="label text-cyber-yellow mb-4 block">FEATURES</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Everything you need to <span className="text-cyber-yellow">win</span></h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto body-text">Powerful features designed to give you the competitive edge in your job search.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <GlassCard key={i} variant="floating" className="p-8" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-cyber-yellow flex items-center justify-center mb-6 shadow-lg">
                  <Icon className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustBadges() {
  const badges = [
    { icon: Award, label: "Best AI Resume Tool 2025" },
    { icon: Shield, label: "SOC 2 Compliant" },
    { icon: Users, label: "50,000+ Users" },
  ];
  return (
    <section className="py-16 px-6 bg-charcoal border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-6">
          {badges.map((badge, i) => (
            <div key={i} className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/30">
              <badge.icon className="w-5 h-5 text-cyber-yellow" />
              <span className="text-sm font-medium text-white">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { step: "01", title: "Paste Job URL", desc: "Drop any job listing link and our AI gets to work instantly." },
    { step: "02", title: "AI Tailors", desc: "We optimize your resume and generate a matching cover letter." },
    { step: "03", title: "We Apply", desc: "Your application is submitted with best-in-class formatting." },
  ];
  return (
    <section className="py-24 px-6 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-yellow/10 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <span className="label text-cyber-yellow mb-4 block">HOW IT WORKS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Three steps to success</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((item, i) => (
            <div key={i} className="relative text-center md:text-left group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[32px] bg-cyber-yellow mb-8 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-black">{item.step}</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-zinc-400 body-text">{item.desc}</p>
              {i < 2 && <div className="hidden md:block absolute top-10 -right-8 lg:-right-16 w-16 lg:w-32 h-px bg-gradient-to-r from-cyber-yellow/50 to-transparent" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-onyx">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="label text-cyber-yellow mb-4 block">TESTIMONIALS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Loved by job seekers</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <GlassCard key={i} className="p-8" variant="floating">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, j) => (<Star key={j} className="w-4 h-4 fill-cyber-yellow text-cyber-yellow" />))}
              </div>
              <p className="text-zinc-300 mb-8 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyber-yellow flex items-center justify-center text-black font-bold text-sm">{t.avatar}</div>
                <div>
                  <div className="text-white font-semibold">{t.name}</div>
                  <div className="text-zinc-500 text-sm">{t.role}</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  return (
    <section className="py-20 px-6 bg-onyx">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-zinc-500 text-sm mb-10">TRUSTED BY PROFESSIONALS AT</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40">
          {partners.map((partner, i) => (<span key={i} className="text-2xl font-bold text-white tracking-wider">{partner.toUpperCase()}</span>))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const router = useRouter();
  return (
    <section className="py-32 px-6 bg-onyx relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyber-yellow/20 rounded-full blur-[150px]" />
      </div>
      <div className="max-w-4xl mx-auto text-center relative">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight">Ready to land your <span className="text-cyber-yellow">dream job?</span></h2>
        <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">Join thousands of professionals who have automated their job search with ApplyMate.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" variant="pill" onClick={() => router.push("/sign-up")}>Start Free Trial <ArrowRight className="w-5 h-5 ml-2" /></Button>
          <Button size="xl" variant="pillLight" onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}>See How It Works</Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyber-yellow flex items-center justify-center"><Zap className="w-5 h-5 text-black" /></div>
          <span className="text-white font-bold text-lg">ApplyMate</span>
        </div>
        <p className="text-zinc-500 text-sm">© 2026 ApplyMate. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("landing");
  const [jobUrl, setJobUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!isLoaded || !mounted) {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyber-yellow/30 border-t-cyber-yellow rounded-full animate-spin" />
      </div>
    );
  }

  const handleStart = () => {
    if (!jobUrl.trim()) return;
    setStep("resume-select");
  };

  const handleContinue = async () => {
    if (!selectedTemplate) return;
    if (!user) { router.push("/sign-in"); return; }
    setStep("processing");
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_url: jobUrl, template: selectedTemplate }) });
      if (res.ok) { setStep("complete"); setTimeout(() => router.push("/dashboard"), 2500); }
      else { setStep("complete"); setTimeout(() => router.push("/dashboard"), 4500); }
    } catch { setStep("complete"); setTimeout(() => router.push("/dashboard"), 4500); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-onyx">
      {step === "landing" ? (
        <>
          <Navbar variant="subtle" />
          <LiquidHero />
          <GetStartedSection />
          <FeaturesSection />
          <TrustBadges />
          <HowItWorks />
          <TestimonialsSection />
          <PartnersSection />
          <CTASection />
          <Footer />
        </>
      ) : (
        <main className="max-w-2xl mx-auto px-8 pt-32 pb-20">
          {step !== "complete" && (
            <div className="flex items-center justify-center gap-2 mb-12">
              {["resume-select", "processing", "complete"].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step === s ? "bg-cyber-yellow text-black" : ["processing", "complete"].includes(step) && i < ["resume-select", "processing", "complete"].indexOf(step) ? "bg-emerald-500 text-white" : "bg-charcoal text-zinc-500"}`}>
                    {["processing", "complete"].includes(step) && i < ["resume-select", "processing", "complete"].indexOf(step) ? <CheckCircle2 className="w-5 h-5" /> : i + 2}
                  </div>
                  {i < 2 && <div className="w-12 h-px bg-charcoal" />}
                </div>
              ))}
            </div>
          )}
          {step === "resume-select" && (
            <div className="animate-scale-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">Choose your <span className="text-cyber-yellow">template</span></h2>
                <p className="text-zinc-400">Select the best profile for your target role</p>
              </div>
              <div className="space-y-3 mb-8">
                {resumeTemplates.map((template) => (
                  <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border ${selectedTemplate === template.id ? "border-cyber-yellow bg-cyber-yellow/10 shadow-[0_0_30px_-10px_rgba(253,224,71,0.3)]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}>
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
                <Button variant="outline" onClick={() => setStep("landing")} className="flex-1 py-5">Back</Button>
                <Button onClick={handleContinue} disabled={!selectedTemplate || loading} className="flex-1">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
              </div>
            </div>
          )}
          {step === "processing" && (
            <div className="text-center py-12 animate-fade-up">
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-cyber-yellow/20 animate-ping" />
                <div className="relative w-28 h-28 rounded-full bg-cyber-yellow flex items-center justify-center shadow-xl"><Sparkles className="w-12 h-12 text-black animate-pulse" /></div>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">Processing your application</h2>
              <p className="text-zinc-400 mb-10">AI is analyzing the job and tailoring your materials...</p>
              <div className="space-y-3 max-w-sm mx-auto text-left">
                {[{ text: "Analyzing job requirements", done: true }, { text: "Tailoring your resume", done: true }, { text: "Generating cover letter", done: false }, { text: "Submitting application", done: false }].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    {item.done ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Loader2 className="w-5 h-5 text-cyber-yellow animate-spin" />}
                    <span className={item.done ? "text-zinc-300" : "text-zinc-500"}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === "complete" && (
            <div className="text-center py-12 animate-scale-in">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cyber-yellow flex items-center justify-center shadow-[0_0_40px_-10px_rgba(253,224,71,0.5)]"><CheckCircle2 className="w-12 h-12 text-black" /></div>
              <h2 className="text-3xl font-bold text-white mb-3">All done!</h2>
              <p className="text-zinc-400 mb-8">Your application has been optimized and submitted.</p>
              <div className="inline-flex items-center gap-2 text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" />Redirecting to dashboard...</div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
