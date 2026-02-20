"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Zap, ChevronRight } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();

  const isLanding = pathname === "/";
  const isAuthPage = pathname?.startsWith("/sign-") || pathname === "/";

  if (isAuthPage && !user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Resumes" },
    { href: "/jobs", label: "Jobs" },
    { href: "/applications", label: "Applications" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">ApplyMate</span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Credits */}
            <Link
              href="/credits"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 text-sm text-zinc-300 hover:text-white transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Credits</span>
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </Link>
            
            {/* User */}
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-violet-500/50 transition-all">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
