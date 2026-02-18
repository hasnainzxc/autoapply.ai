"use client";

import { useUser } from "@clerk/nextjs";
import { BentoGrid } from "@/components/dashboard/bento-grid";
import { ActiveAgents } from "@/components/dashboard/active-agents";
import { CreditBalance } from "@/components/dashboard/credit-balance";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { AddJobButton } from "@/components/dashboard/add-job-button";
import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-6 h-6 border border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Ambient glows - MiniMax style */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header - Minimal and bold */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                Welcome back, <span className="gradient-text">{user?.firstName || "User"}</span>
              </h1>
              <p className="text-zinc-500 mt-1 text-sm">Track and manage your applications</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <CreditBalance />
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

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
