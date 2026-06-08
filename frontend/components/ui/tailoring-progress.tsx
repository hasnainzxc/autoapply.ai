"use client";

import { cn } from "@/lib/utils"

const steps = [
  { id: 1, name: "Reading Input", description: "Parsing resume/profile data" },
  { id: 2, name: "Analyzing Job", description: "Extracting keywords and requirements" },
  { id: 3, name: "Matching Skills", description: "Optimizing resume for ATS score" },
  { id: 4, name: "Building Preview", description: "Generating tailored resume" },
]

interface TailoringProgressProps {
  currentStep: number
  jobTitle?: string
}

export function TailoringProgress({ currentStep, jobTitle }: TailoringProgressProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-medium">
          {steps[currentStep - 1]?.name || "Processing"}
        </span>
        <span className="text-[#6B6B6B]">
          Step {currentStep} of {steps.length}
        </span>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FACC15] to-yellow-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-500",
                  index + 1 < currentStep ? "bg-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.5)]" :
                  index + 1 === currentStep ? "bg-[#FACC15] animate-pulse" :
                  "bg-white/20"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-[#6B6B6B] text-sm animate-pulse">
          {steps[currentStep - 1]?.description || "Processing..."}
        </p>
        {jobTitle && (
          <p className="text-white/60 text-xs mt-1 truncate max-w-[200px] mx-auto">
            {jobTitle}
          </p>
        )}
      </div>
    </div>
  )
}