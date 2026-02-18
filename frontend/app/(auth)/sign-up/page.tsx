"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="glass-card p-8 rounded-2xl">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Join ApplyMate
        </h1>
        <SignUp />
      </div>
    </div>
  );
}
