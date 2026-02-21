"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AgentWorkflowAnimation } from "./agent-workflow";

interface KineticHeroProps {
  onJobUrlSubmit?: (url: string) => void;
}

const words = ["Apply", "Smarter", "Faster"];

export function KineticHero({ onJobUrlSubmit }: KineticHeroProps) {
  const [mounted, setMounted] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobUrl && onJobUrlSubmit) {
      onJobUrlSubmit(jobUrl);
    }
  };

  // Animation variants based on reduced motion preference
  const staggerDelay = prefersReducedMotion ? 0 : 0.15;
  const shouldAnimate = !prefersReducedMotion;

  const hoverScale = shouldAnimate ? { scale: 1.02 } : undefined;
  const tapScale = shouldAnimate ? { scale: 0.98 } : undefined;

  if (!mounted) return null;

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] sm:min-h-screen flex flex-col justify-center overflow-hidden pt-20 sm:pt-24 lg:pt-0">
      {/* Ambient Glow - Responsive */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] sm:top-[20%] left-[10%] sm:left-[25%] w-[300px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[500px] lg:h-[600px] bg-[#FACC15]/5 sm:bg-[#FACC15]/5 rounded-full blur-[100px] sm:blur-[150px] lg:blur-[200px]" />
        <div className="absolute bottom-[10%] sm:bottom-[20%] right-[10%] sm:right-[25%] w-[200px] sm:w-[300px] lg:w-[400px] h-[200px] sm:h-[300px] lg:h-[400px] bg-[#FACC15]/3 rounded-full blur-[80px] sm:blur-[120px] lg:blur-[150px]" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015] sm:opacity-[0.02]" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Text & Input */}
          <div className="order-2 lg:order-1">
            {/* Label */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8"
            >
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#FACC15]/20 bg-[#FACC15]/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse" />
                <span className="text-[10px] sm:text-xs text-[#FACC15] font-mono uppercase tracking-widest">AI-Powered</span>
              </div>
            </motion.div>

            {/* Kinetic Headline - Responsive */}
            <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 sm:mb-8 leading-[0.9]">
              {words.map((word, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    initial={shouldAnimate ? { y: "100%" } : false}
                    animate={{ y: 0 }}
                    transition={{ 
                      duration: shouldAnimate ? 0.8 : 0, 
                      delay: shouldAnimate ? i * staggerDelay : 0,
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

            {/* Subtitle - Responsive */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldAnimate ? 0.4 : 0 }}
              className="text-base sm:text-lg md:text-xl text-[#6B6B6B] max-w-xl sm:max-w-2xl mb-8 sm:mb-10 lg:mb-12 font-light"
            >
              Drop a job URL. We&apos;ll tailor your resume, write the cover letter, 
              and apply — while you watch.
            </motion.p>

            {/* Input Box */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: shouldAnimate ? 0.6 : 0 }}
            >
              <form onSubmit={handleSubmit} className="relative max-w-xl sm:max-w-2xl">
                <div 
                  className={`
                    relative bg-[#1A1A1A]/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border transition-all duration-500
                    ${isFocused 
                      ? 'border-[#FACC15]/50 shadow-[0_0_30px_-8px_rgba(250,204,21,0.25)]' 
                      : 'border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div className="flex-shrink-0 mr-3 sm:mr-4">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Paste job URL..."
                      className="flex-1 bg-transparent text-sm sm:text-base md:text-lg text-[#E4E2DD] placeholder-[#6B6B6B] outline-none font-mono min-h-[24px]"
                      required
                    />
                    <motion.button
                      type="submit"
                      whileHover={hoverScale}
                      whileTap={tapScale}
                      className={`
                        ml-2 sm:ml-3 lg:ml-4 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 min-h-[40px] sm:min-h-[44px]
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
                  
                  {jobUrl && shouldAnimate && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-[#FACC15]/30 pointer-events-none"
                    />
                  )}
                </div>
              </form>

              {/* Quick Stats - Responsive */}
              <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <div className="w-1 h-1 rounded-full bg-[#FACC15]" />
                  <span className="font-mono">50K+</span>
                  <span className="hidden sm:inline">applications</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <div className="w-1 h-1 rounded-full bg-[#FACC15]" />
                  <span className="font-mono">92%</span>
                  <span className="hidden sm:inline">interview rate</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <div className="w-1 h-1 rounded-full bg-[#FACC15]" />
                  <span className="font-mono">2min</span>
                  <span className="hidden sm:inline">setup</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Agent Workflow Animation - Desktop Only */}
          <div className="hidden lg:block relative order-1 lg:order-2">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card rounded-2xl border border-white/10 p-6 lg:p-8"
            >
              <div className="text-xs text-[#6B6B6B] font-mono uppercase tracking-widest mb-4 lg:mb-6 text-center">
                Agent Pipeline
              </div>
              <AgentWorkflowAnimation />
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 lg:w-24 lg:h-24 bg-[#FACC15]/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 lg:w-32 lg:h-32 bg-[#FACC15]/5 rounded-full blur-3xl" />
          </div>

          {/* Mobile Agent Workflow - Below Input */}
          <div className="lg:hidden order-3">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="glass-card rounded-xl border border-white/10 p-4"
            >
              <div className="text-[10px] text-[#6B6B6B] font-mono uppercase tracking-widest mb-3 text-center">
                Agent Pipeline
              </div>
              <AgentWorkflowAnimation />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FACC15]/30 to-transparent" />
    </section>
  );
}
