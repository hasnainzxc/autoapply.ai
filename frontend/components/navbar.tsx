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

  const isLanding = pathname === "/";
  const isAuthPage = pathname?.startsWith("/sign-");

  if (!isLoaded) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Resumes" },
    { href: "/jobs", label: "Jobs" },
    { href: "/applications", label: "Applications" },
  ];

  const isSubtle = variant === "subtle";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-all ${
      isSubtle 
        ? "bg-onyx/60 border-white/5" 
        : "bg-onyx/80 border-white/5"
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-cyber-yellow flex items-center justify-center shadow-lg shadow-cyber-yellow/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className={`text-lg font-semibold ${isSubtle ? "text-white" : "text-white"}`}>ApplyMate</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? "bg-cyber-yellow text-black"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/credits"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-zinc-300 hover:text-white transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-cyber-yellow" />
                  <span>Credits</span>
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                </Link>
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-cyber-yellow/30 hover:ring-cyber-yellow/60 transition-all">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className={isSubtle ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-zinc-300 hover:text-white hover:bg-white/5"}
                onClick={() => window.location.href = "/sign-in"}
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                className="rounded-full bg-cyber-yellow text-black hover:bg-cyber-yellow/90"
                onClick={() => window.location.href = "/sign-up"}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
