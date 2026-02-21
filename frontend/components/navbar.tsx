"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  variant?: "default" | "subtle";
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!isLoaded) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "Resumes" },
    { href: "/jobs", label: "Jobs" },
    { href: "/applications", label: "Applications" },
  ];

  const isSubtle = variant === "subtle";

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isSubtle 
            ? "bg-[#080808]/95 backdrop-blur-xl border-b border-white/5" 
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#FACC15] flex items-center justify-center shadow-lg shadow-[#FACC15]/20 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#080808]" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-[#E4E2DD]">ApplyMate</span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive 
                          ? "bg-[#FACC15] text-[#080808]" 
                          : "text-[#6B6B6B] hover:text-[#E4E2DD] hover:bg-white/5"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Side - Desktop */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  {/* Credits - Desktop */}
                  <Link 
                    href="/credits" 
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-[#E4E2DD] transition-all min-h-[44px]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FACC15]" />
                    <span>Credits</span>
                    <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
                  </Link>
                  
                  {/* User Button - Desktop */}
                  <div className="hidden sm:block w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#FACC15]/30 hover:ring-[#FACC15]/60 transition-all">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#E4E2DD] hover:text-white hover:bg-white/5 min-h-[44px]"
                    onClick={() => window.location.href = "/sign-in"}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm" 
                    className="rounded-full bg-[#FACC15] text-[#080808] hover:bg-[#EAB308] min-h-[44px]"
                    onClick={() => window.location.href = "/sign-up"}
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-[#E4E2DD] hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-[#0A0A0A] border-l border-white/10 z-50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <span className="text-lg font-semibold text-[#E4E2DD]">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#E4E2DD] hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-2">
                  {user ? (
                    <>
                      {navItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                              isActive
                                ? "bg-[#FACC15]/10 text-[#FACC15]"
                                : "text-[#E4E2DD] hover:bg-white/5"
                            }`}
                          >
                            <span>{item.label}</span>
                            {isActive && <div className="w-2 h-2 rounded-full bg-[#FACC15]" />}
                          </Link>
                        );
                      })}
                      
                      <hr className="border-white/10 my-4" />
                      
                      <Link
                        href="/credits"
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium text-[#E4E2DD] hover:bg-white/5 transition-all"
                      >
                        <span>Credits</span>
                        <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-[#E4E2DD] hover:bg-white/5 min-h-[50px]"
                        onClick={() => window.location.href = "/sign-in"}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="w-full justify-center bg-[#FACC15] text-[#080808] hover:bg-[#EAB308] min-h-[50px]"
                        onClick={() => window.location.href = "/sign-up"}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </nav>

                {/* User Section - Mobile */}
                {user && (
                  <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#FACC15]/30">
                        <UserButton afterSignOutUrl="/" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#E4E2DD] truncate">
                          {user.firstName || user.username}
                        </p>
                        <p className="text-xs text-[#6B6B6B] truncate">
                          {user.emailAddresses[0]?.emailAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
