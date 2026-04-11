"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

interface SalaryFormProps {
  slug: string;
  companyName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const EXPERIENCE_RANGES = [
  "0-1 years", "1-3 years", "3-5 years",
  "5-8 years", "8-12 years", "12-15 years", "15+ years",
];

export function SalaryForm({ slug, companyName, onSuccess, onCancel }: SalaryFormProps) {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [totalComp, setTotalComp] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="bg-cream border border-ink/15 px-6 py-8 text-center space-y-3">
        <p className="text-sm text-warmgray font-sans">Sign in to submit salary data</p>
        <Link
          href="/login"
          className="inline-block text-xs uppercase tracking-[0.12em] bg-ink text-cream px-5 py-2.5 hover:bg-terracotta transition-colors font-sans"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const base = parseFloat(baseSalary);
    if (!role.trim() || isNaN(base) || base <= 0) { setError("Role and base salary are required"); return; }
    const total = totalComp ? parseFloat(totalComp) : null;
    if (total != null && (isNaN(total) || total < 0)) { setError("Invalid total compensation"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, role: role.trim(), location: location.trim() || null, baseSalary: base, totalComp: total, experience: experience || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit"); return; }
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-10 px-3 text-sm text-ink placeholder:text-warmgray/40 bg-white border border-ink/20 outline-none focus:border-terracotta transition-colors font-sans";

  return (
    <div className="bg-cream border border-ink/15 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ink/10 bg-white">
        <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Share Salary at {companyName}</span>
        <p className="text-[11px] text-warmgray font-sans mt-0.5">Your data is anonymous and helps others make informed decisions.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-[#B05252]/10 text-[#B05252] text-sm px-3 py-2 border border-[#B05252]/25 font-sans">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Your Role *</label>
          <input placeholder="e.g. Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} maxLength={100} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Location (optional)</label>
          <input placeholder="e.g. Bangalore" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Base Salary (INR/year) *</label>
            <input type="number" placeholder="e.g. 1200000" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} min={0} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Total Comp (optional)</label>
            <input type="number" placeholder="Including bonuses, stocks" value={totalComp} onChange={(e) => setTotalComp(e.target.value)} min={0} className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Experience</label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setExperience(experience === range ? "" : range)}
                className={`px-3 py-1.5 text-xs border font-sans transition-colors ${
                  experience === range
                    ? "bg-terracotta border-terracotta text-white"
                    : "border-ink/20 text-warmgray hover:border-terracotta hover:text-terracotta"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="text-xs uppercase tracking-[0.1em] px-4 py-2 border border-ink/20 text-warmgray hover:border-ink/40 transition-colors font-sans">Cancel</button>
          <button type="submit" disabled={submitting} className="text-xs uppercase tracking-[0.1em] px-4 py-2 bg-ink text-cream hover:bg-terracotta transition-colors font-sans disabled:opacity-40">
            {submitting ? "Submitting..." : "Submit Salary"}
          </button>
        </div>
      </form>
    </div>
  );
}
