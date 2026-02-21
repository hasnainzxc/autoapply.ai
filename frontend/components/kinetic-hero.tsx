"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AgentWorkflowAnimation } from "./agent-workflow";

interface KineticHeroProps {
  onJobUrlSubmit?: (url: string) => void;
}

const words = ["Apply", "Smarter", "Faster"];

export function KineticHero({ onJobUrlSubmit }: KineticHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobUrl && onJobUrlSubmit) {
      onJobUrlSubmit(jobUrl);
    }
  };

  if (!mounted) return null;

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FACC15]/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FACC15]/3 rounded-full blur-[150px]" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text & Input */}
          <div>
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FACC15]/20 bg-[#FACC15]/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse" />
                <span className="text-xs text-[#FACC15] font-mono uppercase tracking-widest">AI-Powered</span>
              </div>
            </motion.div>

            {/* Kinetic Headline */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8 leading-[0.9]">
              {words.map((word, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: i * 0.15,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    className="block text-[#E4E2DD]"
                  >
                    {word}
                    {i === 1 && <span className="text-[#FACC15]">.</span>}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-[#6B6B6B] max-w-2xl mb-12 font-light"
            >
              Drop a job URL. We&apos;ll tailor your resume, write the cover letter, 
              and apply — while you watch.
            </motion.p>

            {/* Input Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <form onSubmit={handleSubmit} className="relative max-w-2xl">
                <div 
                  className={`
                    relative bg-[#1A1A1A]/80 backdrop-blur-xl rounded-2xl border transition-all duration-500
                    ${isFocused 
                      ? 'border-[#FACC15]/50 shadow-[0_0_40px_-10px_rgba(250,204,21,0.3)]' 
                      : 'border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center px-6 py-4">
                    <div className="flex-shrink-0 mr-4">
                      <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Paste any job URL to get started..."
                      className="flex-1 bg-transparent text-lg text-[#E4E2DD] placeholder-[#6B6B6B] outline-none font-mono"
                      required
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        ml-4 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
                        ${jobUrl 
                          ? 'bg-[#FACC15] text-[#080808] hover:bg-[#EAB308]' 
                          : 'bg-white/10 text-[#6B6B6B] cursor-not-allowed'
                        }
                      `}
                      disabled={!jobUrl}
                    >
                      Analyze
                    </motion.button>
                  </div>
                  
                  {jobUrl && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-2xl border-2 border-[#FACC15]/30 pointer-events-none"
                    />
                  )}
                </div>
              </form>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-8 mt-8 text-sm">
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <div className="w-1 h-1 rounded-full bg-[#FACC15]" />
                  <span className="font-mono">50K+</span>
                  <span>applications sent</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <div className="w-1 h-1 rounded-full bg-[#FACC15]" />
                  <span className="font-mono">92%</span>
                  <span>interview rate</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <div className="w-1 h-1 rounded-full bg-[#FACC15]" />
                  <span className="font-mono">2min</span>
                  <span>setup time</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Agent Workflow Animation */}
          <div className="hidden lg:block relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="glass-card rounded-2xl border border-white/10 p-8"
            >
              <div className="text-xs text-[#6B6B6B] font-mono uppercase tracking-widest mb-6 text-center">
                Agent Pipeline
              </div>
              <AgentWorkflowAnimation />
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FACC15]/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#FACC15]/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FACC15]/30 to-transparent" />
    </section>
  );
}
