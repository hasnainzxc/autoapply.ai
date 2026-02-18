"use client";

import { useEffect, useState } from "react";

interface CreditData {
  balance: number;
  lifetime_purchased: number;
  lifetime_used: number;
  subscription_tier: string;
}

export function CreditBalance() {
  const [credits, setCredits] = useState<CreditData | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch("/api/credits/balance");
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
        }
      } catch (e) {
        console.error("Failed to fetch credits", e);
      }
    }
    fetchCredits();
  }, []);

  return (
    <div className="glass-card px-5 py-2.5 rounded-xl flex items-center gap-4">
      <div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Credits</p>
        <p className="text-lg font-semibold text-white">{credits?.balance ?? "—"}</p>
      </div>
      <div className="w-px h-8 bg-zinc-800" />
      <div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Plan</p>
        <p className="text-sm font-medium text-purple-400">{credits?.subscription_tier ?? "Free"}</p>
      </div>
    </div>
  );
}
