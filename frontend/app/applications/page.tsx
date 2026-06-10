"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { ApplicationTable } from "@/components/applications/application-table";
import { ApplicationDetail } from "@/components/applications/application-detail";
import { TrackerStats } from "@/components/applications/tracker-stats";
import { FunnelAnalytics } from "@/components/applications/funnel-analytics";
import { Search, ChevronDown, ListFilter } from "lucide-react";

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  company_logo: string;
  location: string;
  salary_range: string;
  status: string;
  match_score: number;
  score_rating: string;
  has_pdf: boolean;
  report_path: string;
  report_number: string;
  portal: string;
  notes: string;
  cv_used: string;
  job_url: string;
  applied_at: string;
  created_at: string;
}

const STATUS_GROUPS = [
  { label: "All", value: "all", color: "bg-[#FACC15]" },
  { label: "Applied", value: "applied", color: "bg-[#22C55E]" },
  { label: "Interview", value: "interview", color: "bg-[#A855F7]" },
  { label: "Offer", value: "offer", color: "bg-[#06B6D4]" },
  { label: "Evaluated", value: "evaluated", color: "bg-[#F59E0B]" },
  { label: "Responded", value: "responded", color: "bg-[#3B82F6]" },
  { label: "Rejected", value: "rejected", color: "bg-[#EF4444]" },
  { label: "Discarded", value: "discarded", color: "bg-[#6B6B6B]" },
];

export default function ApplicationsPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/applications`)
      .then(r => r.json())
      .then(data => {
        setApplications(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user, router]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesSearch = !searchQuery || 
        app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [applications, statusFilter, searchQuery]);

  const activeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }, [applications]);

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
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FACC15]/4 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-[#A855F7]/3 rounded-full blur-[180px]" />
      </div>

      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold text-[#E4E2DD] tracking-tight"
          >
            Application Tracker
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-[#6B6B6B] mt-1 text-sm"
          >
            Track, manage, and analyze your job applications
          </motion.p>
        </header>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <TrackerStats />
        </motion.div>

        {/* Funnel + Filters Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            {/* Search & Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="text"
                  placeholder="Search by company or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#E4E2DD] placeholder:text-[#6B6B6B] focus:border-[#FACC15]/30 focus:ring-2 focus:ring-[#FACC15]/10 focus:outline-none transition-all text-sm"
                />
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {STATUS_GROUPS.map(group => (
                  <button
                    key={group.value}
                    onClick={() => setStatusFilter(group.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      statusFilter === group.value
                        ? "bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]/30"
                        : "bg-white/5 text-[#6B6B6B] border-white/10 hover:bg-white/10 hover:text-[#E4E2DD]"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${group.color}`} />
                    {group.label}
                    {activeCounts[group.value] && statusFilter === "all" ? (
                      <span className="text-[10px] opacity-60">({activeCounts[group.value]})</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Application List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {loading ? (
                <div className="glass-card p-12 rounded-2xl border border-white/5 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#FACC15]/30 border-t-[#FACC15] rounded-full animate-spin" />
                </div>
              ) : (
                <ApplicationTable
                  applications={filteredApps}
                  onSelect={(app) => setSelectedApp(app as Application)}
                />
              )}
            </motion.div>
          </div>

          {/* Funnel Sidebar */}
          <div>
            <FunnelAnalytics />
          </div>
        </div>
      </div>

      {/* Detail Slide-over */}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
