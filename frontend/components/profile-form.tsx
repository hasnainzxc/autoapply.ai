"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Briefcase, MapPin, Code, FileText, Sparkles, Loader2, AlertCircle } from "lucide-react";

/**
 * Profile data collected from manual entry flow.
 * Sent as profile_data JSON string to /api/resume/tailor-v3.
 */
export interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  experience_years: number;
  current_role?: string;
  location?: string;
  skills?: string;
  summary?: string;
}

interface ProfileFormProps {
  onSubmit: (profileData: ProfileData) => Promise<void>;
  isLoading: boolean;
  innerRef?: React.RefObject<HTMLFormElement | null>;
}

interface FieldError {
  full_name?: string;
  email?: string;
  phone?: string;
  experience_years?: string;
}

function validate(data: ProfileData): FieldError {
  const errors: FieldError = {};

  if (!data.full_name.trim()) {
    errors.full_name = "Full name is required";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!data.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (data.experience_years < 0 || data.experience_years > 30) {
    errors.experience_years = "Enter 0-30 years";
  }

  return errors;
}

export function ProfileForm({ onSubmit, isLoading, innerRef }: ProfileFormProps) {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    experience_years: 0,
    current_role: "",
    location: "",
    skills: "",
    summary: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof ProfileData, value: string | number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const updated = { ...profile, [field]: value };
      const newErrors = validate(updated);
      setErrors((prev) => ({ ...prev, [field]: newErrors[field as keyof FieldError] }));
    }
  };

  const handleBlur = (field: keyof ProfileData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate(profile);
    setErrors((prev) => ({ ...prev, [field]: newErrors[field as keyof FieldError] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(profile);
    setErrors(validationErrors);
    setTouched({
      full_name: true,
      email: true,
      phone: true,
      experience_years: true,
    });

    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit(profile);
  };

  const hasRequired = profile.full_name.trim() && profile.email.trim() && profile.phone.trim() && profile.experience_years >= 0;

  const inputClass = (field: keyof FieldError) =>
    `w-full bg-[#1A1A1A] border rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-colors ${
      errors[field] ? "border-red-500/50" : "border-white/10"
    }`;

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Your Profile</h2>
          <p className="text-xs text-[#6B6B6B]">Fill in your details to tailor your resume</p>
        </div>
      </div>

      <form id="profile-entry-form" ref={innerRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              onBlur={() => handleBlur("full_name")}
              placeholder="John Doe"
              className={`${inputClass("full_name")} pl-10`}
            />
          </div>
          {errors.full_name && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {errors.full_name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="john@example.com"
              className={`${inputClass("email")} pl-10`}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Phone *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder="+1-555-555-5555"
              className={`${inputClass("phone")} pl-10`}
            />
          </div>
          {errors.phone && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Experience Years */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Years of Experience *</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="number"
              min={0}
              max={30}
              value={profile.experience_years || ""}
              onChange={(e) => handleChange("experience_years", parseInt(e.target.value) || 0)}
              onBlur={() => handleBlur("experience_years")}
              placeholder="4"
              className={`${inputClass("experience_years")} pl-10`}
            />
          </div>
          {errors.experience_years && (
            <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {errors.experience_years}
            </p>
          )}
        </div>

        {/* Current Role */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Current Role</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="text"
              value={profile.current_role}
              onChange={(e) => handleChange("current_role", e.target.value)}
              placeholder="Software Engineer"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 px-4 py-3 text-white text-sm placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-colors"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 px-4 py-3 text-white text-sm placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-colors"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Skills</label>
          <div className="relative">
            <Code className="absolute left-3 top-3.5 w-4 h-4 text-[#6B6B6B]" />
            <input
              type="text"
              value={profile.skills}
              onChange={(e) => handleChange("skills", e.target.value)}
              placeholder="Python, React, AWS, ..."
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 px-4 py-3 text-white text-sm placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FACC15] transition-colors"
            />
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-1">Comma-separated list of skills</p>
        </div>

        {/* Summary */}
        <div>
          <label className="text-[#6B6B6B] text-sm mb-1.5 block">Professional Summary</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3.5 w-4 h-4 text-[#6B6B6B]" />
            <textarea
              value={profile.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="Brief professional summary..."
              rows={4}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#FACC15] resize-none transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            disabled={!hasRequired || isLoading}
            className="w-full rounded-xl bg-[#FACC15] text-black hover:bg-[#FACC15]/90 font-medium h-12"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Tailored Resume
              </span>
            )}
          </Button>
        </motion.div>
      </form>
    </GlassCard>
  );
}
