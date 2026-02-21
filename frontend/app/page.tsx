"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useScroll, useTransform } from "framer-motion";
import { KineticHero } from "@/components/kinetic-hero";
import { GlobalWire, PulsingIndicator } from "@/components/global-wire";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { 
  Sparkles, FileText, Rocket, TrendingUp, 
  ArrowRight, CheckCircle, Zap, Target
} from "lucide-react";

const features = [
  { 
    icon: Sparkles, 
    title: "AI Resume Tailoring", 
    description: "Our AI analyzes job descriptions and optimizes your resume for maximum impact.",
    status: "active"
  },
  { 
    icon: FileText, 
    title: "Cover Letters", 
    description: "Personalized cover letters that sound authentically like you.",
    status: "ready"
  },
  { 
    icon: Rocket, 
    title: "Auto-Apply", 
    description: "One-click applications to hundreds of relevant job postings.",
    status: "ready"
  },
  { 
    icon: TrendingUp, 
    title: "Smart Tracking", 
    description: "Track all your applications with intelligent status updates.",
    status: "ready"
  },
];

const steps = [
  { number: "01", title: "Paste Job URL", desc: "Drop any job listing link" },
  { number: "02", title: "AI Tailors", desc: "We optimize your resume" },
  { number: "03", title: "We Apply", desc: "Submit automatically" },
];

function BentoFeature({ 
  feature, 
  index, 
  scrollProgress 
}: { 
  feature: typeof features[0]; 
  index: number;
  scrollProgress: number;
}) {
  const Icon = feature.icon;
  const isActive = scrollProgress > (index * 0.25);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`
        glass-card p-6 rounded-xl border relative overflow-hidden
        hover:border-[#FACC15]/30 transition-all duration-300
        ${isActive ? 'border-[#FACC15]/20' : 'border-white/5'}
      `}
    >
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FACC15] to-transparent"
        />
      )}
      
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
          ${isActive ? 'bg-[#FACC15]/20' : 'bg-white/5'}
        `}>
          <Icon className={`w-6 h-6 ${isActive ? 'text-[#FACC15]' : 'text-[#6B6B6B]'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-[#E4E2DD]">{feature.title}</h3>
            {isActive && <PulsingIndicator />}
          </div>
          <p className="text-[#6B6B6B] text-sm leading-relaxed">{feature.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturesSection({ containerRef }: { containerRef: React.RefObject<HTMLElement> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="py-32 px-6 relative" ref={containerRef}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs text-[#FACC15] font-mono uppercase tracking-widest mb-4 block">CAPABILITIES</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#E4E2DD] tracking-tight">
            Your AI Recruiting Team
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <BentoFeature 
              key={i} 
              feature={feature} 
              index={i}
              scrollProgress={progress.get()}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-32 px-6 relative">
      {/* Section Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FACC15]/20 to-transparent" />
      
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs text-[#FACC15] font-mono uppercase tracking-widest mb-4 block">WORKFLOW</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#E4E2DD] tracking-tight">
            Three Steps to Landing
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="glass-card p-8 rounded-xl border border-white/5">
                <div className="text-6xl font-bold text-[#FACC15]/10 mb-4 font-mono">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-[#E4E2DD] mb-2">{step.title}</h3>
                <p className="text-[#6B6B6B]">{step.desc}</p>
              </div>
              
              {/* Connector */}
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-[#FACC20]/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 px-6 relative">
      {/* Section Divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FACC15]/20 to-transparent" />
      
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-[#E4E2DD] tracking-tight mb-6">
            Ready to <span className="text-[#FACC15]">automate</span> your search?
          </h2>
          <p className="text-xl text-[#6B6B6B] mb-8">
            Join thousands of job seekers who land interviews faster.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ShinyButton variant="yellow">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </ShinyButton>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/20 text-[#E4E2DD] hover:bg-white/5 rounded-full px-8"
            >
              View Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FACC15] flex items-center justify-center">
            <span className="text-xs font-bold text-[#080808]">A</span>
          </div>
          <span className="text-[#E4E2DD] font-semibold">ApplyMate</span>
        </div>
        <p className="text-[#6B6B6B] text-sm">
          © 2026 ApplyMate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);

  // Don't auto-redirect - show landing page first
  // User can navigate to dashboard manually or via navbar

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FACC15]/30 border-t-[#FACC15] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Navbar */}
      <Navbar />
      
      {/* Global Wire Animation */}
      <GlobalWire containerRef={containerRef} />
      
      {/* Kinetic Hero */}
      <KineticHero />
      
      {/* Features */}
      <FeaturesSection containerRef={containerRef} />
      
      {/* How It Works */}
      <HowItWorksSection />
      
      {/* CTA */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
