"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  variant?: "default" | "subtle";
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Resumes" },
    { href: "/jobs", label: "Jobs" },
    { href: "/applications", label: "Applications" },
  ];

  const isSubtle = variant === "subtle";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all ${isSubtle ? "bg-[#080808]/60 border-white/5" : "bg-[#080808]/80 border-white/5"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#FACC15] flex items-center justify-center shadow-lg shadow-[#FACC15]/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-[#080808]" />
            </div>
            <span className="text-lg font-semibold text-[#E4E2DD]">ApplyMate</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? "bg-[#FACC15] text-[#080808]" : "text-[#6B6B6B] hover:text-[#E4E2DD] hover:bg-white/5"}`}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <Link href="/credits" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-[#E4E2DD] hover:text-white transition-all">
                  <span className="w-2 h-2 rounded-full bg-[#FACC15]" />
                  <span>Credits</span>
                  <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
                </Link>
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#FACC15]/30 hover:ring-[#FACC15]/60 transition-all">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-[#E4E2DD] hover:text-white hover:bg-white/5" onClick={() => window.location.href = "/sign-in"}>
                Sign In
              </Button>
              <Button size="sm" className="rounded-full bg-[#FACC15] text-[#080808] hover:bg-[#EAB308]" onClick={() => window.location.href = "/sign-up"}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
