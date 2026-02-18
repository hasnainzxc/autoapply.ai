"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center">
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[180px]" />
      </div>

      <div className="w-full max-w-md mx-6">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">
            ApplyMate
          </h1>
          <p className="text-zinc-500">AI-powered job application automation</p>
        </div>
        
        <div className="glass-card p-8 rounded-2xl">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white text-xl font-medium",
                headerSubtitle: "text-zinc-500",
                socialButtonsBlockButton: "bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700",
                socialButtonsBlockButtonText: "text-white",
                formFieldInput: "bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20",
                formButtonPrimary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
                footerActionLink: "text-purple-400 hover:text-purple-300",
                dividerLine: "bg-zinc-800",
                dividerText: "text-zinc-600",
                identityPreviewText: "text-zinc-400",
                formFieldLabel: "text-zinc-400",
                otpCodeFieldInput: "bg-zinc-900/50 border-zinc-800 text-white",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
