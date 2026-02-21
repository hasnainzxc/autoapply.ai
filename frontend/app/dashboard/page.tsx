"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { ActiveAgents } from "@/components/dashboard/active-agents";
import { CreditBalance } from "@/components/dashboard/credit-balance";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { AddJobButton } from "@/components/dashboard/add-job-button";
import { Button } from "@/components/ui/button";
import { AnimatedList, AnimatedListItem, ApplicationItem } from "@/components/ui/animated-list";
import { ShinyButton } from "@/components/ui/shiny-button";

interface Application {
  id: string;
  job_title: string;
  company: string;
  status: "queued" | "analyzing" | "applying" | "applied" | "failed";
  match_score?: number;
  created_at: string;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [hasResume, setHasResume] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    
    const checkResume = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/resumes`);
        if (res.ok) {
          const data = await res.json();
          setResumeCount(data.resumes?.length || 0);
          setHasResume((data.resumes?.length || 0) > 0);
        }
      } catch (error) { console.error("Failed to check resumes", error); }
    };

    const fetchApplications = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/applications`);
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (error) { console.error("Failed to fetch applications", error); }
      finally {
        setLoading(false);
      }
    };

    checkResume();
    fetchApplications();
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FACC15]/30 border-t-[#FACC15] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] relative">
      <Navbar />
      
      {/* Ambient Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#FACC15]/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FACC15]/3 rounded-full blur-[180px]" />
      </div>

      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-semibold text-[#E4E2DD] tracking-tight"
            >
              Welcome back, <span className="text-[#FACC15]">{user?.firstName || "User"}</span>
            </motion.h1>
            <p className="text-[#6B6B6B] mt-1 text-sm">Track and manage your applications</p>
          </div>
          <CreditBalance />
        </header>

        {/* Resume CTA or Ready State */}
        {!hasResume ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-2xl mb-8 border border-[#FACC15]/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FACC15]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#FACC15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#E4E2DD]">Upload your resume</h3>
                  <p className="text-[#6B6B6B] text-sm">Get started by uploading your resume</p>
                </div>
              </div>
              <ShinyButton variant="yellow" onClick={() => router.push("/resumes")}>
                Upload Resume
              </ShinyButton>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-2xl mb-8 flex items-center justify-between border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[#E4E2DD] font-medium">{resumeCount} resume{resumeCount !== 1 ? 's' : ''} uploaded</p>
                <p className="text-[#6B6B6B] text-sm">Ready to tailor</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full border-white/10 text-[#E4E2DD] hover:bg-white/5" 
              onClick={() => router.push("/resumes")}
            >
              View Resumes
            </Button>
          </motion.div>
        )}

        {/* Bento Grid */}
        <BentoGrid />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Recent Applications with Animated List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#E4E2DD]">Recent Applications</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#FACC15] hover:text-[#FACC15]/80"
                  onClick={() => router.push("/applications")}
                >
                  View All
                </Button>
              </div>
              
              {loading ? (
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#FACC15]/30 border-t-[#FACC15] rounded-full animate-spin" />
                  </div>
                </div>
              ) : applications.length > 0 ? (
                <AnimatedList>
                  {applications.slice(0, 5).map((app, index) => (
                    <AnimatedListItem key={app.id} delay={index * 0.1}>
                      <ApplicationItem
                        title={app.job_title}
                        company={app.company}
                        status={app.status}
                        matchScore={app.match_score}
                      />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              ) : (
                <div className="glass-card p-8 rounded-2xl border border-white/5 text-center">
                  <p className="text-[#6B6B6B] mb-4">No applications yet</p>
                  <ShinyButton variant="yellow" onClick={() => router.push("/jobs")}>
                    Find Jobs
                  </ShinyButton>
                </div>
              )}
            </motion.div>
          </div>

          {/* Active Agents */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-[#E4E2DD] mb-4">Active Agents</h2>
              <ActiveAgents />
            </motion.div>
          </div>
        </div>

        {/* Add Job Button */}
        <div className="mt-12 flex justify-center">
          <AddJobButton />
        </div>
      </div>
    </div>
  );
}
