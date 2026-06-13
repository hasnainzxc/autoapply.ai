"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Search, Plus, ExternalLink, Globe, Loader2, Sparkles } from "lucide-react";

interface ScanEntry {
  id: string;
  job_url: string;
  title: string;
  company: string;
  location: string;
  portal: string;
  status: string;
  first_seen: string;
  last_seen: string;
}

interface PipelineEntry {
  id: string;
  job_url: string;
  title: string;
  company: string;
  section: string;
  created_at: string;
}

export default function JobsPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"scan-history" | "pipeline">("scan-history");
  const [scanEntries, setScanEntries] = useState<ScanEntry[]>([]);
  const [pipelineEntries, setPipelineEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    Promise.all([
      fetch(`${apiUrl}/api/scan-history`).then(r => r.json()),
      fetch(`${apiUrl}/api/pipeline`).then(r => r.json()),
    ])
      .then(([scans, pipelines]) => {
        setScanEntries(scans || []);
        setPipelineEntries(pipelines || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user, router]);

  const filteredScans = useMemo(() => {
    if (!searchQuery) return scanEntries;
    const q = searchQuery.toLowerCase();
    return scanEntries.filter(e =>
      e.company?.toLowerCase().includes(q) ||
      e.title?.toLowerCase().includes(q) ||
      e.portal?.toLowerCase().includes(q)
    );
  }, [scanEntries, searchQuery]);

  const portalGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    scanEntries.forEach(e => {
      const portal = e.portal || "unknown";
      groups[portal] = (groups[portal] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [scanEntries]);

  async function addToPipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl) return;
    setAddLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_url: newUrl }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewUrl("");
        window.location.reload();
      }
    } finally {
      setAddLoading(false);
    }
  }

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
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FACC15]/4 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-[#3B82F6]/3 rounded-full blur-[180px]" />
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
              Jobs Pipeline
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-[#6B6B6B] mt-1 text-sm"
            >
              Discover, evaluate, and track job opportunities
            </motion.p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-full bg-[#FACC15] text-[#080808] hover:bg-[#EAB308]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Job URL
          </Button>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab("scan-history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "scan-history"
                ? "bg-[#FACC15] text-[#080808]"
                : "text-[#6B6B6B] hover:text-[#E4E2DD]"
            }`}
          >
            <Globe className="w-4 h-4 inline mr-1.5" />
            Scan History
            {scanEntries.length > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({scanEntries.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "pipeline"
                ? "bg-[#FACC15] text-[#080808]"
                : "text-[#6B6B6B] hover:text-[#E4E2DD]"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1.5" />
            Pipeline
            {pipelineEntries.length > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({pipelineEntries.length})</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="glass-card p-16 rounded-2xl border border-white/5 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#FACC15] animate-spin" />
          </div>
        ) : activeTab === "scan-history" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Scan List */}
            <div className="lg:col-span-3">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="text"
                  placeholder="Search by company, role, or portal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#E4E2DD] placeholder:text-[#6B6B6B] focus:border-[#FACC15]/30 focus:ring-2 focus:ring-[#FACC15]/10 focus:outline-none transition-all text-sm"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                {filteredScans.length === 0 ? (
                  <div className="glass-card p-12 rounded-2xl border border-white/5 text-center">
                    <Globe className="w-12 h-12 text-[#6B6B6B] mx-auto mb-3" />
                    <p className="text-[#E4E2DD] font-medium">No scan history</p>
                    <p className="text-[#6B6B6B] text-sm mt-1">Add job URLs to start scanning</p>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Company</th>
                            <th className="text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Role</th>
                            <th className="hidden md:table-cell text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Location</th>
                            <th className="hidden sm:table-cell text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Portal</th>
                            <th className="text-right px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredScans.slice(0, 100).map((entry, i) => (
                            <motion.tr
                              key={entry.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.005 }}
                              className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-3">
                                <span className="text-sm text-[#E4E2DD] font-medium">{entry.company}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-[#E4E2DD]">{entry.title}</span>
                              </td>
                              <td className="hidden md:table-cell px-4 py-3">
                                <span className="text-sm text-[#6B6B6B]">{entry.location || "--"}</span>
                              </td>
                              <td className="hidden sm:table-cell px-4 py-3">
                                <span className="text-[10px] text-[#6B6B6B] bg-white/5 px-1.5 py-0.5 rounded font-mono">{entry.portal || "--"}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <a
                                  href={entry.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#FACC15] hover:text-[#EAB308] transition-colors"
                                >
                                  Open <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Portal Stats Sidebar */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 rounded-2xl border border-white/5"
              >
                <h3 className="text-sm font-semibold text-[#E4E2DD] mb-3">Portals</h3>
                <div className="space-y-2">
                  {portalGroups.slice(0, 15).map(([portal, count]) => (
                    <div key={portal} className="flex items-center justify-between">
                      <span className="text-xs text-[#6B6B6B] truncate">{portal}</span>
                      <span className="text-xs text-[#E4E2DD] font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Pipeline Tab */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {pipelineEntries.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl border border-white/5 text-center">
                <Sparkles className="w-12 h-12 text-[#6B6B6B] mx-auto mb-3" />
                <p className="text-[#E4E2DD] font-medium">Pipeline is empty</p>
                <p className="text-[#6B6B6B] text-sm mt-1">Add job URLs to your pipeline to track them</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Company</th>
                        <th className="text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Role</th>
                        <th className="text-left px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Section</th>
                        <th className="text-right px-4 py-3 text-[10px] text-[#6B6B6B] uppercase tracking-wider font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineEntries.map((entry, i) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#E4E2DD] font-medium">{entry.company || "--"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-[#E4E2DD]">{entry.title || "--"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">{entry.section}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={entry.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#FACC15] hover:text-[#EAB308] transition-colors"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl w-full max-w-md mx-4 border border-white/10"
          >
            <h2 className="text-xl font-semibold text-[#E4E2DD] mb-6">Add to Pipeline</h2>
            <form onSubmit={addToPipeline} className="space-y-5">
              <div>
                <label className="block text-sm text-[#6B6B6B] mb-2 font-medium">Job URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://jobs.lever.co/company/job"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#E4E2DD] placeholder:text-[#6B6B6B] focus:border-[#FACC15]/30 focus:ring-4 focus:ring-[#FACC15]/10 focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#E4E2DD] transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 px-4 py-3 bg-[#FACC15] text-[#080808] hover:bg-[#EAB308] rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                >
                  {addLoading ? "Adding..." : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
