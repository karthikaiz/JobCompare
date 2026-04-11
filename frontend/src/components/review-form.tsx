"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

interface ReviewFormProps {
  slug: string;
  companyName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] uppercase tracking-[0.1em] text-warmgray font-sans min-w-[130px]">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" && value < 5) onChange(value + 1);
              if (e.key === "ArrowLeft" && value > 1) onChange(value - 1);
            }}
            aria-label={`Rate ${star} out of 5`}
            className={`text-xl transition-colors min-w-[28px] min-h-[28px] ${star <= value ? "text-terracotta" : "text-ink/15 hover:text-terracotta/40"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ slug, companyName, onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [isCurrentEmployee, setIsCurrentEmployee] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const [overallRating, setOverallRating] = useState(0);
  const [workLifeBalanceRating, setWorkLifeBalanceRating] = useState(0);
  const [salaryRating, setSalaryRating] = useState(0);
  const [jobSecurityRating, setJobSecurityRating] = useState(0);
  const [careerGrowthRating, setCareerGrowthRating] = useState(0);
  const [companyCultureRating, setCompanyCultureRating] = useState(0);

  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");

  if (!user) {
    return (
      <div className="bg-cream border border-ink/15 px-6 py-8 text-center space-y-3">
        <p className="text-sm text-warmgray font-sans">Sign in to submit a review</p>
        <Link
          href="/login"
          className="inline-block text-xs uppercase tracking-[0.12em] bg-ink text-cream px-5 py-2.5 hover:bg-terracotta transition-colors font-sans"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, title, role,
          location: location || null,
          overallRating,
          workLifeBalanceRating: workLifeBalanceRating || null,
          salaryRating: salaryRating || null,
          jobSecurityRating: jobSecurityRating || null,
          careerGrowthRating: careerGrowthRating || null,
          companyCultureRating: companyCultureRating || null,
          pros, cons, isAnonymous, isCurrentEmployee,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit review"); return; }
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
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Review {companyName}</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-0.5 flex-1 ${s <= step ? "bg-terracotta" : "bg-ink/10"}`} />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mt-1.5">
          Step {step} of 3 — {step === 1 ? "About You" : step === 2 ? "Ratings" : "Your Review"}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-[#B05252]/10 text-[#B05252] text-sm px-3 py-2 border border-[#B05252]/25 font-sans">{error}</div>
        )}

        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Review Title *</label>
              <input
                placeholder='e.g. "Great work culture but average pay"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Your Role *</label>
              <input
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Location (optional)</label>
              <input
                placeholder="e.g. Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-ink font-sans cursor-pointer">
                <input type="checkbox" checked={isCurrentEmployee} onChange={(e) => setIsCurrentEmployee(e.target.checked)} className="accent-terracotta" />
                Currently work here
              </label>
              <label className="flex items-center gap-2 text-xs text-ink font-sans cursor-pointer">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-terracotta" />
                Post anonymously
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onCancel} className="text-xs uppercase tracking-[0.1em] px-4 py-2 border border-ink/20 text-warmgray hover:border-ink/40 transition-colors font-sans">Cancel</button>
              <button type="button" onClick={() => setStep(2)} disabled={!title.trim() || !role.trim()} className="text-xs uppercase tracking-[0.1em] px-4 py-2 bg-ink text-cream hover:bg-terracotta transition-colors font-sans disabled:opacity-40">Next</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3">
              <StarInput value={overallRating} onChange={setOverallRating} label="Overall *" />
              <StarInput value={workLifeBalanceRating} onChange={setWorkLifeBalanceRating} label="Work-Life Balance" />
              <StarInput value={salaryRating} onChange={setSalaryRating} label="Salary & Benefits" />
              <StarInput value={jobSecurityRating} onChange={setJobSecurityRating} label="Job Security" />
              <StarInput value={careerGrowthRating} onChange={setCareerGrowthRating} label="Career Growth" />
              <StarInput value={companyCultureRating} onChange={setCompanyCultureRating} label="Culture" />
            </div>
            <div className="flex justify-between pt-1">
              <button type="button" onClick={() => setStep(1)} className="text-xs uppercase tracking-[0.1em] px-4 py-2 border border-ink/20 text-warmgray hover:border-ink/40 transition-colors font-sans">Back</button>
              <button type="button" onClick={() => setStep(3)} disabled={overallRating === 0} className="text-xs uppercase tracking-[0.1em] px-4 py-2 bg-ink text-cream hover:bg-terracotta transition-colors font-sans disabled:opacity-40">Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Pros *</label>
              <textarea
                placeholder="What do you like about working here?"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 text-sm text-ink placeholder:text-warmgray/40 bg-white border border-ink/20 outline-none focus:border-terracotta transition-colors font-sans resize-none"
              />
              <span className="text-[10px] text-warmgray font-sans">{pros.length}/2000</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Cons *</label>
              <textarea
                placeholder="What could be improved?"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 text-sm text-ink placeholder:text-warmgray/40 bg-white border border-ink/20 outline-none focus:border-terracotta transition-colors font-sans resize-none"
              />
              <span className="text-[10px] text-warmgray font-sans">{cons.length}/2000</span>
            </div>
            <div className="flex justify-between pt-1">
              <button type="button" onClick={() => setStep(2)} className="text-xs uppercase tracking-[0.1em] px-4 py-2 border border-ink/20 text-warmgray hover:border-ink/40 transition-colors font-sans">Back</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || !pros.trim() || !cons.trim()} className="text-xs uppercase tracking-[0.1em] px-4 py-2 bg-ink text-cream hover:bg-terracotta transition-colors font-sans disabled:opacity-40">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
