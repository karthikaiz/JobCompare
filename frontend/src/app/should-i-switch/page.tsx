"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { COST_OF_LIVING, CITY_NAMES, toBaselineSalary } from "@/lib/cost-of-living";

/* ── Types ─── */

interface CompanyResult {
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
  workLifeBalance: number | null;
  salaryBenefits: number | null;
  jobSecurity: number | null;
  careerGrowth: number | null;
  companyCulture: number | null;
}

interface JobInput {
  companySlug: string;
  companyName: string;
  role: string;
  salary: string; // annual in Rupees
  yearsHere: string;
  city: string;
}

interface Verdict {
  recommendation: "switch" | "stay" | "toss-up";
  financialDelta: number; // COL-adjusted, positive = new is better
  financialPct: number;
  currentData: CompanyResult | null;
  newData: CompanyResult | null;
  factors: Array<{ label: string; current: number; newOffer: number; winner: "current" | "new" | "tie"; weight: number }>;
  score: number; // -100 to 100, positive = switch
}

const EMPTY_JOB: JobInput = { companySlug: "", companyName: "", role: "", salary: "", yearsHere: "", city: "Bangalore" };

/* ── Company search ─── */

function CompanySearch({ value, onSelect, placeholder }: { value: string; onSelect: (slug: string, name: string) => void; placeholder: string }) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<Array<{ slug: string; name: string }>>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { setQ(value); }, [value]);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    try {
      const res = await fetch(`/api/companies?q=${encodeURIComponent(term)}&limit=6`);
      const data = await res.json();
      setResults(data.companies?.map((c: { slug: string; name: string }) => ({ slug: c.slug, name: c.name })) || []);
      setOpen(true);
    } catch { setResults([]); }
  }, []);

  const select = (r: { slug: string; name: string }) => {
    setQ(r.name);
    setOpen(false);
    onSelect(r.slug, r.name);
  };

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); search(e.target.value); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-ink/20 bg-card text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 bg-card border border-ink/15 shadow-md max-h-56 overflow-y-auto">
          {results.map((r) => (
            <button key={r.slug} onMouseDown={() => select(r)} className="w-full text-left px-3 py-2 text-sm font-sans text-ink hover:bg-cream transition-colors">
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Formatted input ─── */

function RupeeInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const display = value ? Number(value).toLocaleString("en-IN") : "";
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray text-sm">₹</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        className="w-full pl-7 pr-3 py-2 border border-ink/20 bg-card text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
      />
    </div>
  );
}

/* ── Step components ─── */

function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-8 h-8 border-2 border-terracotta text-terracotta flex items-center justify-center text-sm font-mono font-bold">{step}</span>
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans">Step {step} of {total}</div>
        <div className="font-serif font-bold text-ink text-lg">{title}</div>
      </div>
    </div>
  );
}

function JobForm({ job, setJob, label }: { job: JobInput; setJob: (j: JobInput) => void; label: string }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1 block">{label} Company</label>
        <CompanySearch
          value={job.companyName}
          onSelect={(slug, name) => setJob({ ...job, companySlug: slug, companyName: name })}
          placeholder="Search company..."
        />
        <p className="text-[10px] text-warmgray/60 font-sans mt-0.5">Select from our database for richer comparison data</p>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1 block">Role / Title</label>
        <input
          value={job.role}
          onChange={(e) => setJob({ ...job, role: e.target.value })}
          placeholder="e.g. Senior Software Engineer"
          className="w-full px-3 py-2 border border-ink/20 bg-card text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1 block">Annual Salary (CTC)</label>
          <RupeeInput value={job.salary} onChange={(v) => setJob({ ...job, salary: v })} placeholder="e.g. 1800000" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1 block">
            {label === "Current" ? "Years at Company" : "Expected Tenure"}
          </label>
          <input
            type="number"
            min="0"
            max="40"
            value={job.yearsHere}
            onChange={(e) => setJob({ ...job, yearsHere: e.target.value })}
            placeholder="e.g. 3"
            className="w-full px-3 py-2 border border-ink/20 bg-card text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1 block">City</label>
        <select
          value={job.city}
          onChange={(e) => setJob({ ...job, city: e.target.value })}
          className="w-full px-3 py-2 border border-ink/20 bg-card text-ink text-sm font-sans focus:outline-none focus:border-terracotta"
        >
          {CITY_NAMES.map((c) => (
            <option key={c} value={c}>{c} (COL: {COST_OF_LIVING[c].index})</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── Verdict computation ─── */

async function computeVerdict(current: JobInput, newOffer: JobInput): Promise<Verdict> {
  // Fetch company data if available
  let currentData: CompanyResult | null = null;
  let newData: CompanyResult | null = null;

  const fetchCompany = async (slug: string): Promise<CompanyResult | null> => {
    if (!slug) return null;
    try {
      const res = await fetch(`/api/company/${slug}`);
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  };

  [currentData, newData] = await Promise.all([
    fetchCompany(current.companySlug),
    fetchCompany(newOffer.companySlug),
  ]);

  const curSalary = Number(current.salary) || 0;
  const newSalary = Number(newOffer.salary) || 0;

  const curAdjusted = toBaselineSalary(curSalary, current.city);
  const newAdjusted = toBaselineSalary(newSalary, newOffer.city);
  const financialDelta = newAdjusted - curAdjusted;
  const financialPct = curAdjusted > 0 ? (financialDelta / curAdjusted) * 100 : 0;

  // Build factor comparison
  const factors: Verdict["factors"] = [];

  // Financial factor (always available)
  const financialScore = Math.min(Math.max(financialPct / 5, -10), 10); // normalize to -10..10
  factors.push({
    label: "Financial (COL-adjusted)",
    current: Math.round(curAdjusted),
    newOffer: Math.round(newAdjusted),
    winner: financialDelta > 0 ? "new" : financialDelta < 0 ? "current" : "tie",
    weight: financialScore,
  });

  // Company data factors
  if (currentData && newData) {
    const ratingPairs: Array<{ label: string; key: keyof CompanyResult }> = [
      { label: "Career Growth", key: "careerGrowth" },
      { label: "Work-Life Balance", key: "workLifeBalance" },
      { label: "Job Security", key: "jobSecurity" },
      { label: "Company Culture", key: "companyCulture" },
      { label: "Overall Rating", key: "overallRating" },
    ];

    for (const { label, key } of ratingPairs) {
      const curVal = (currentData[key] as number | null) ?? 0;
      const newVal = (newData[key] as number | null) ?? 0;
      const delta = newVal - curVal;
      factors.push({
        label,
        current: curVal,
        newOffer: newVal,
        winner: delta > 0.1 ? "new" : delta < -0.1 ? "current" : "tie",
        weight: delta * 5, // scale rating delta
      });
    }
  }

  // Tenure risk factor: switching too early (<2 years) is a slight negative signal
  const yearsAt = Number(current.yearsHere) || 0;
  if (yearsAt < 2) {
    factors.push({
      label: "Tenure Stability",
      current: yearsAt,
      newOffer: 0,
      winner: "current",
      weight: -3,
    });
  } else if (yearsAt > 5) {
    // Long tenure — switching may be refreshing
    factors.push({
      label: "Career Freshness",
      current: yearsAt,
      newOffer: 0,
      winner: "new",
      weight: 2,
    });
  }

  const totalScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const normalizedScore = Math.min(Math.max(totalScore * 3, -100), 100);

  let recommendation: Verdict["recommendation"] = "toss-up";
  if (normalizedScore > 20) recommendation = "switch";
  else if (normalizedScore < -20) recommendation = "stay";

  return {
    recommendation,
    financialDelta,
    financialPct,
    currentData,
    newData,
    factors,
    score: Math.round(normalizedScore),
  };
}

/* ── Format helpers ─── */

function formatLakhs(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

/* ── Results ─── */

function VerdictDisplay({ verdict, current, newOffer }: { verdict: Verdict; current: JobInput; newOffer: JobInput }) {
  const bgColor = verdict.recommendation === "switch"
    ? "bg-[#4A7C59]/10 border-[#4A7C59]/30"
    : verdict.recommendation === "stay"
      ? "bg-terracotta/10 border-terracotta/30"
      : "bg-ink/5 border-ink/15";

  const textColor = verdict.recommendation === "switch"
    ? "text-[#4A7C59]"
    : verdict.recommendation === "stay"
      ? "text-terracotta"
      : "text-ink";

  const emoji = verdict.recommendation === "switch" ? "Go for it." : verdict.recommendation === "stay" ? "Stay put." : "It's a close call.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Verdict banner */}
      <div className={`border-2 ${bgColor} p-6 text-center`}>
        <div className="text-[10px] uppercase tracking-[0.18em] text-warmgray font-sans mb-2">Our Recommendation</div>
        <div className={`font-serif font-bold text-3xl ${textColor}`}>
          {verdict.recommendation === "switch" ? "Switch" : verdict.recommendation === "stay" ? "Stay" : "Toss-Up"}
        </div>
        <div className="text-sm text-warmgray font-sans mt-1">{emoji}</div>
        <div className="mt-4 flex justify-center">
          <div className="w-48 h-2 bg-ink/10 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-1/2 h-full bg-terracotta rounded-full"
              initial={{ width: 0, x: 0 }}
              animate={{
                width: `${Math.abs(verdict.score) / 2}%`,
                x: verdict.score >= 0 ? 0 : `-${Math.abs(verdict.score) / 2}%`,
              }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-ink/30" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-warmgray font-sans mt-1 w-48 mx-auto">
          <span>Stay</span>
          <span>Switch</span>
        </div>
      </div>

      {/* Financial comparison */}
      <div className="bg-card border border-ink/15 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
          <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Financial Comparison</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1">Current ({current.city})</div>
            <div className="font-mono text-lg text-ink font-bold">{formatLakhs(Number(current.salary) || 0)}/yr</div>
            <div className="text-xs text-warmgray font-sans mt-0.5">
              COL-adjusted: {formatLakhs(toBaselineSalary(Number(current.salary) || 0, current.city))}/yr
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1">New Offer ({newOffer.city})</div>
            <div className="font-mono text-lg text-ink font-bold">{formatLakhs(Number(newOffer.salary) || 0)}/yr</div>
            <div className="text-xs text-warmgray font-sans mt-0.5">
              COL-adjusted: {formatLakhs(toBaselineSalary(Number(newOffer.salary) || 0, newOffer.city))}/yr
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className={`text-sm font-sans font-medium ${verdict.financialDelta > 0 ? "text-[#4A7C59]" : verdict.financialDelta < 0 ? "text-[#B05252]" : "text-warmgray"}`}>
            {verdict.financialDelta > 0 ? "+" : ""}{verdict.financialPct.toFixed(1)}% effective salary change
            ({verdict.financialDelta > 0 ? "+" : ""}{formatLakhs(Math.abs(verdict.financialDelta))}/yr)
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="bg-card border border-ink/15 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
          <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Factor Breakdown</span>
        </div>
        <div className="divide-y divide-ink/8">
          {verdict.factors.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink font-sans font-medium">{f.label}</div>
                {f.label.includes("Financial") ? (
                  <div className="text-xs text-warmgray font-sans mt-0.5">
                    {formatLakhs(f.current)} vs {formatLakhs(f.newOffer)}
                  </div>
                ) : f.label.includes("Tenure") || f.label.includes("Freshness") ? (
                  <div className="text-xs text-warmgray font-sans mt-0.5">
                    {f.current} years at current company
                  </div>
                ) : (
                  <div className="text-xs text-warmgray font-sans mt-0.5">
                    {f.current.toFixed(1)} vs {f.newOffer.toFixed(1)}
                  </div>
                )}
              </div>
              <span className={`text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 border font-sans font-medium ${
                f.winner === "new"
                  ? "bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/30"
                  : f.winner === "current"
                    ? "bg-terracotta/10 text-terracotta border-terracotta/30"
                    : "bg-ink/5 text-warmgray border-ink/15"
              }`}>
                {f.winner === "new" ? "New wins" : f.winner === "current" ? "Current wins" : "Tie"}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Company comparison if data available */}
      {verdict.currentData && verdict.newData && (
        <div className="bg-card border border-ink/15 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
            <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Company Ratings</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-6">
            {[
              { label: "Current", data: verdict.currentData, name: current.companyName },
              { label: "New", data: verdict.newData, name: newOffer.companyName },
            ].map(({ label, data, name }) => (
              <div key={label}>
                <Link href={`/job-seeker/${data.slug}`} className="font-serif font-bold text-ink text-base hover:text-terracotta transition-colors">
                  {name}
                </Link>
                <div className="text-xs text-warmgray font-sans mt-0.5">{data.industry}</div>
                <div className="mt-3 space-y-1.5">
                  {[
                    { l: "Overall", v: data.overallRating },
                    { l: "Growth", v: data.careerGrowth },
                    { l: "Work-Life", v: data.workLifeBalance },
                    { l: "Security", v: data.jobSecurity },
                    { l: "Culture", v: data.companyCulture },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-[11px] text-warmgray font-sans">{l}</span>
                      <span className="text-sm font-mono font-bold text-ink">{v?.toFixed(1) ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link
          href="/job-seeker/compare/offers"
          className="text-[10px] uppercase tracking-[0.1em] px-4 py-2 border-2 border-terracotta text-terracotta font-sans hover:bg-terracotta hover:text-white transition-colors"
        >
          Compare Full Offers
        </Link>
        <Link
          href="/job-seeker"
          className="text-[10px] uppercase tracking-[0.1em] px-4 py-2 border border-ink/25 text-warmgray font-sans hover:border-terracotta hover:text-terracotta transition-colors"
        >
          Browse Companies
        </Link>
      </div>
    </motion.div>
  );
}

/* ── Main Page ─── */

export default function ShouldISwitchPage() {
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState<JobInput>({ ...EMPTY_JOB });
  const [newOffer, setNewOffer] = useState<JobInput>({ ...EMPTY_JOB });
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [computing, setComputing] = useState(false);

  const canProceedStep1 = current.salary && current.city;
  const canProceedStep2 = newOffer.salary && newOffer.city;

  const handleCompute = async () => {
    setComputing(true);
    try {
      const result = await computeVerdict(current, newOffer);
      setVerdict(result);
      setStep(3);
    } finally {
      setComputing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCurrent({ ...EMPTY_JOB });
    setNewOffer({ ...EMPTY_JOB });
    setVerdict(null);
  };

  return (
    <DashboardShell role="job-seeker">
      <div className="bg-cream min-h-screen p-4 sm:p-6 pb-20 sm:pb-6">
        <div className="max-w-xl mx-auto">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="w-6 h-px bg-terracotta" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">Career Decision Tool</span>
              <span className="w-6 h-px bg-terracotta" />
            </div>
            <h1 className="font-serif font-bold text-ink text-3xl sm:text-4xl">
              Should I <span className="text-terracotta italic">Switch?</span>
            </h1>
            <p className="text-warmgray text-sm font-sans mt-2 max-w-md mx-auto">
              Enter your current job and new offer. We&apos;ll compare salary (adjusted for cost of living), company ratings, and career factors.
            </p>
          </motion.div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1 bg-ink/8 overflow-hidden">
                <motion.div
                  className="h-full bg-terracotta"
                  initial={{ width: 0 }}
                  animate={{ width: step >= s ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-card border border-ink/15 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Your Current Situation</span>
                  </div>
                  <div className="p-5">
                    <StepHeader step={1} total={2} title="Your Current Job" />
                    <JobForm job={current} setJob={setCurrent} label="Current" />
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setStep(2)}
                        disabled={!canProceedStep1}
                        className="text-[10px] uppercase tracking-[0.1em] px-5 py-2.5 bg-terracotta text-white font-sans hover:bg-[#B0623C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next: New Offer →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-card border border-ink/15 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">The New Opportunity</span>
                  </div>
                  <div className="p-5">
                    <StepHeader step={2} total={2} title="New Offer Details" />
                    <JobForm job={newOffer} setJob={setNewOffer} label="New" />
                    <div className="mt-6 flex items-center justify-between">
                      <button
                        onClick={() => setStep(1)}
                        className="text-[10px] uppercase tracking-[0.1em] px-4 py-2 border border-ink/25 text-warmgray font-sans hover:border-terracotta hover:text-terracotta transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleCompute}
                        disabled={!canProceedStep2 || computing}
                        className="text-[10px] uppercase tracking-[0.1em] px-5 py-2.5 bg-terracotta text-white font-sans hover:bg-[#B0623C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {computing ? "Analyzing..." : "Should I Switch?"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && verdict && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans">
                      {current.companyName || "Current"} → {newOffer.companyName || "New Offer"}
                    </span>
                  </div>
                  <button
                    onClick={reset}
                    className="text-[10px] uppercase tracking-[0.1em] px-3 py-1.5 border border-ink/25 text-warmgray font-sans hover:border-terracotta hover:text-terracotta transition-colors"
                  >
                    Start Over
                  </button>
                </div>
                <VerdictDisplay verdict={verdict} current={current} newOffer={newOffer} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  );
}
