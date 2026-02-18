"use client";

import { useState } from "react";

export function AddJobButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_url: url }),
      });
      
      if (res.ok) {
        setIsOpen(false);
        setUrl("");
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to add job", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
      >
        + Add Job
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 rounded-2xl w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-white mb-6">Add Job to Apply</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-zinc-500 mb-2 font-medium">
                  Job URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://jobs.lever.co/company/job"
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 rounded-xl text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl text-white transition-all disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
