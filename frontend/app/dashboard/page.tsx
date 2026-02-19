"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { ActiveAgents } from "@/components/dashboard/active-agents";
import { CreditBalance } from "@/components/dashboard/credit-balance";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { AddJobButton } from "@/components/dashboard/add-job-button";

interface Resume {
  id: string;
  original_file_path: string;
}

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const [hasResume, setHasResume] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);

  useEffect(() => {
    const checkResume = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/resumes");
        if (res.ok) {
          const data = await res.json();
          setResumeCount(data.resumes?.length || 0);
          setHasResume((data.resumes?.length || 0) > 0);
        }
      } catch (error) {
        console.error("Failed to check resumes", error);
      }
    };
    checkResume();
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <Navbar />
      
      {/* Ambient glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[180px]" />
      </div>

      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">
              Welcome back, <span className="gradient-text">{user?.firstName || "User"}</span>
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">Track and manage your applications</p>
          </div>
          <CreditBalance />
        </header>

        {/* Resume Status Card */}
        {!hasResume ? (
          <div className="glass-card p-6 rounded-2xl mb-8 border-2 border-dashed border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Upload your resume</h3>
                  <p className="text-zinc-500 text-sm">Get started by uploading your resume</p>
                </div>
              </div>
              <a
                href="/resumes"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all"
              >
                Upload Resume
              </a>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 rounded-xl mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">{resumeCount} resume{resumeCount !== 1 ? 's' : ''} uploaded</p>
                <p className="text-zinc-500 text-sm">Ready to tailor</p>
              </div>
            </div>
            <a
              href="/resumes"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-all"
            >
              View Resumes
            </a>
          </div>
        )}

        {/* Bento Grid */}
        <BentoGrid />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <RecentApplications />
          </div>
          <div>
            <ActiveAgents />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12 flex justify-center">
          <AddJobButton />
        </div>
      </div>
    </div>
  );
}
