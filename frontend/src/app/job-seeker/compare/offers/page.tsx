"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { COST_OF_LIVING, CITY_NAMES, compareColAdjusted } from "@/lib/cost-of-living";
import { getIndustryStandard } from "@/lib/industry-standards-source";

/* ── Types ─────────────────────────────────────────────────────────────── */

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
  benefits: Array<{ category: string; name: string }>;
  sentiment: { positiveCount: number; negativeCount: number; neutralCount: number } | null;
}

interface OfferInput {
  companySlug: string;
  companyName: string;
  role: string;
  baseSalary: string;        // in full Rupees, string for form control
  annualBonus: string;
  joiningBonus: string;
  wfhDays: number;
  city: string;
}

const EMPTY_OFFER: OfferInput = {
  companySlug: "",
  companyName: "",
  role: "",
  baseSalary: "",
  annualBonus: "0",
  joiningBonus: "0",
  wfhDays: 0,
  city: "Bangalore",
};

const PRIORITY_LABELS = [
  { key: "salary",   label: "Salary & Comp",    icon: "₹" },
  { key: "wlb",      label: "Work-Life Balance", icon: "⏱" },
  { key: "growth",   label: "Career Growth",     icon: "↑" },
  { key: "culture",  label: "Culture & Team",    icon: "❤" },
  { key: "security", label: "Job Security",      icon: "🔒" },
] as const;

type PriorityKey = typeof PRIORITY_LABELS[number]["key"];

const DEFAULT_PRIORITIES: Record<PriorityKey, number> = {
  salary: 3, wlb: 3, growth: 3, culture: 3, security: 3,
};

const COLORS = { A: "#C4714A", B: "#4A7C59" };

/* ── Helpers ────────────────────────────────────────────────────────────── */

// Format full rupee values for display (e.g. 600000 → "6.0L", 10500000 → "1.05Cr")
function formatRupees(val: number) {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000)   return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)     return `${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function parseRupees(s: string): number {
  return Math.max(0, parseFloat(s) || 0);
}

function totalComp(offer: OfferInput): number {
  return parseRupees(offer.baseSalary) + parseRupees(offer.annualBonus);
}

function colAdjustedBase(offer: OfferInput): number {
  const base = parseRupees(offer.baseSalary);
  const col = COST_OF_LIVING[offer.city];
  if (!col) return base;
  return base * (100 / col.index);
}

function personalScore(
  offer: OfferInput,
  company: CompanyResult | null,
  priorities: Record<PriorityKey, number>
): number | null {
  if (!company) return null;
  const base = parseRupees(offer.baseSalary);
  if (!base) return null;

  // Normalise priority weights (sum to 1)
  const total = Object.values(priorities).reduce((a, b) => a + b, 0) || 1;
  const w = {
    salary:   priorities.salary / total,
    wlb:      priorities.wlb / total,
    growth:   priorities.growth / total,
    culture:  priorities.culture / total,
    security: priorities.security / total,
  };

  // Salary score: COL-adjusted base out of a generous cap (40L = 4,000,000 rupees)
  const salaryScore = Math.min(colAdjustedBase(offer) / 4000000, 1) * 5;

  // Company dimension scores (0–5 scale from DB)
  const wlbScore = company.workLifeBalance ?? 3;
  const growthScore = company.careerGrowth ?? 3;
  const cultureScore = company.companyCulture ?? 3;
  const securityScore = company.jobSecurity ?? 3;

  // WFH bonus: each WFH day adds 0.1 to WLB score (capped at 5)
  const wlbAdjusted = Math.min(wlbScore + offer.wfhDays * 0.1, 5);

  return (
    w.salary   * salaryScore +
    w.wlb      * wlbAdjusted +
    w.growth   * growthScore +
    w.culture  * cultureScore +
    w.security * securityScore
  );
}

/* ── Company search autocomplete ────────────────────────────────────────── */

function CompanySearch({
  value, onChange, placeholder,
}: {
  value: OfferInput;
  onChange: (v: OfferInput) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState(value.companyName);
  const [results, setResults] = useState<{ slug: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((text: string) => {
    clearTimeout(timer.current);
    if (!text.trim()) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/companies?q=${encodeURIComponent(text)}&limit=8`);
      const data = await res.json();
      setResults(data.companies ?? []);
      setOpen(true);
    }, 220);
  }, []);

  function select(item: { slug: string; name: string }) {
    setQ(item.name);
    setOpen(false);
    setResults([]);
    onChange({ ...value, companySlug: item.slug, companyName: item.name });
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); search(e.target.value); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-ink/20 bg-white text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-ink/15 shadow-md max-h-56 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.slug}
              onMouseDown={() => select(r)}
              className="w-full text-left px-3 py-2 text-sm font-sans text-ink hover:bg-cream transition-colors"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Results section ─────────────────────────────────────────────────────── */

function ResultsView({
  offerA, offerB, companyA, companyB, priorities,
}: {
  offerA: OfferInput;
  offerB: OfferInput;
  companyA: CompanyResult | null;
  companyB: CompanyResult | null;
  priorities: Record<PriorityKey, number>;
}) {
  const tcA = totalComp(offerA);
  const tcB = totalComp(offerB);
  const colA = colAdjustedBase(offerA);
  const colB = colAdjustedBase(offerB);

  const { adjustedA, adjustedB } = compareColAdjusted(
    parseRupees(offerA.baseSalary), offerA.city,
    parseRupees(offerB.baseSalary), offerB.city,
  );

  const scoreA = personalScore(offerA, companyA, priorities);
  const scoreB = personalScore(offerB, companyB, priorities);

  const winner: "A" | "B" | "tie" =
    scoreA === null || scoreB === null ? "tie"
    : scoreA > scoreB + 0.05 ? "A"
    : scoreB > scoreA + 0.05 ? "B"
    : "tie";

  /* Radar data */
  const RADAR_KEYS = [
    { label: "WLB",      aKey: "workLifeBalance",  bKey: "workLifeBalance" },
    { label: "Salary",   aKey: "salaryBenefits",   bKey: "salaryBenefits" },
    { label: "Security", aKey: "jobSecurity",      bKey: "jobSecurity" },
    { label: "Growth",   aKey: "careerGrowth",     bKey: "careerGrowth" },
    { label: "Culture",  aKey: "companyCulture",   bKey: "companyCulture" },
  ];

  const radarData = RADAR_KEYS.map(({ label, aKey }) => ({
    subject: label,
    A: (companyA?.[aKey as keyof CompanyResult] as number | null) ?? 0,
    B: (companyB?.[aKey as keyof CompanyResult] as number | null) ?? 0,
  }));

  const hasSomeRating = companyA?.overallRating != null || companyB?.overallRating != null;

  /* Benefits */
  const benefitCatsA = new Set((companyA?.benefits ?? []).map((b) => b.category));
  const benefitCatsB = new Set((companyB?.benefits ?? []).map((b) => b.category));
  const allBenefitCats = Array.from(new Set([...Array.from(benefitCatsA), ...Array.from(benefitCatsB)])).sort();

  return (
    <div className="space-y-5">

      {/* Recommendation banner */}
      {winner !== "tie" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`px-5 py-4 border-l-4 ${winner === "A" ? "border-[#C4714A] bg-[#C4714A]/5" : "border-[#4A7C59] bg-[#4A7C59]/5"}`}
        >
          <p className="font-serif font-bold text-ink text-base">
            Based on your priorities,&nbsp;
            <span style={{ color: COLORS[winner] }}>
              {winner === "A" ? offerA.companyName : offerB.companyName}
            </span>
            &nbsp;looks like the stronger offer.
          </p>
          <p className="text-xs text-warmgray font-sans mt-0.5">
            Personalised score: {winner === "A"
              ? `${scoreA!.toFixed(2)} vs ${scoreB!.toFixed(2)}`
              : `${scoreB!.toFixed(2)} vs ${scoreA!.toFixed(2)}`}
          </p>
        </motion.div>
      )}

      {/* Compensation comparison */}
      <div className="bg-white border border-ink/15">
        <div className="px-5 py-2.5 border-b border-ink/10 bg-cream">
          <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Compensation</span>
        </div>
        <div className="divide-y divide-ink/8">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_1fr] px-5 py-2 text-[10px] uppercase tracking-widest text-warmgray/60 font-sans">
            <span></span>
            <span className="text-center font-bold" style={{ color: COLORS.A }}>{offerA.companyName || "Offer A"}</span>
            <span className="text-center font-bold" style={{ color: COLORS.B }}>{offerB.companyName || "Offer B"}</span>
          </div>
          {[
            {
              label: "Base Salary",
              a: formatRupees(parseRupees(offerA.baseSalary)),
              b: formatRupees(parseRupees(offerB.baseSalary)),
              highlight: parseRupees(offerA.baseSalary) !== parseRupees(offerB.baseSalary)
                ? (parseRupees(offerA.baseSalary) > parseRupees(offerB.baseSalary) ? "A" : "B")
                : null,
            },
            {
              label: "Annual Bonus",
              a: formatRupees(parseRupees(offerA.annualBonus)),
              b: formatRupees(parseRupees(offerB.annualBonus)),
              highlight: null,
            },
            {
              label: "Total Annual Comp",
              a: formatRupees(tcA),
              b: formatRupees(tcB),
              highlight: tcA !== tcB ? (tcA > tcB ? "A" : "B") : null,
              bold: true,
            },
            {
              label: "City",
              a: offerA.city,
              b: offerB.city,
              highlight: null,
            },
            {
              label: "COL-Adjusted Base",
              a: formatRupees(colA),
              b: formatRupees(colB),
              highlight: colA !== colB ? (colA > colB ? "A" : "B") : null,
              tip: "Purchasing power equivalent in Bangalore terms",
            },
            {
              label: "WFH Days",
              a: `${offerA.wfhDays}d/wk`,
              b: `${offerB.wfhDays}d/wk`,
              highlight: offerA.wfhDays !== offerB.wfhDays ? (offerA.wfhDays > offerB.wfhDays ? "A" : "B") : null,
            },
          ].map((row) => (
            <div key={row.label} className={`grid grid-cols-[1fr_1fr_1fr] px-5 py-2.5 items-center ${row.bold ? "bg-cream/50" : ""}`}>
              <div>
                <span className={`text-xs font-sans ${row.bold ? "font-bold text-ink" : "text-warmgray"}`}>{row.label}</span>
                {row.tip && <p className="text-[10px] text-warmgray/50 font-sans leading-tight mt-0.5">{row.tip}</p>}
              </div>
              <span className={`text-sm text-center font-sans ${row.bold ? "font-bold" : ""} ${row.highlight === "A" ? "text-[#C4714A] font-bold" : "text-ink"}`}>
                {row.a}
              </span>
              <span className={`text-sm text-center font-sans ${row.bold ? "font-bold" : ""} ${row.highlight === "B" ? "text-[#4A7C59] font-bold" : "text-ink"}`}>
                {row.b}
              </span>
            </div>
          ))}
        </div>

        {/* Joining bonus row if either has one */}
        {(parseRupees(offerA.joiningBonus) > 0 || parseRupees(offerB.joiningBonus) > 0) && (
          <div className="px-5 py-2 border-t border-dashed border-ink/10 grid grid-cols-[1fr_1fr_1fr] items-center">
            <span className="text-xs text-warmgray/60 font-sans italic">One-time joining bonus</span>
            <span className="text-sm text-center font-sans text-ink">
              {parseRupees(offerA.joiningBonus) > 0 ? formatRupees(parseRupees(offerA.joiningBonus)) : "—"}
            </span>
            <span className="text-sm text-center font-sans text-ink">
              {parseRupees(offerB.joiningBonus) > 0 ? formatRupees(parseRupees(offerB.joiningBonus)) : "—"}
            </span>
          </div>
        )}
      </div>

      {/* COL context strip */}
      {offerA.city !== offerB.city && (
        <div className="px-4 py-3 bg-ink/3 border border-ink/10 text-xs text-warmgray font-sans">
          <strong className="text-ink">Cost of living note:</strong>{" "}
          {offerA.city} (COL index {COST_OF_LIVING[offerA.city]?.index ?? 100}) vs{" "}
          {offerB.city} (COL index {COST_OF_LIVING[offerB.city]?.index ?? 100}). The adjusted figures above
          normalise both salaries to Bangalore purchasing power so you can compare apples to apples.
        </div>
      )}

      {/* Ratings overlay */}
      {hasSomeRating && (
        <div className="bg-white border border-ink/15">
          <div className="px-5 py-2.5 border-b border-ink/10 bg-cream">
            <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Company Ratings</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Per-dimension bars — company name inline with each bar */}
            <div className="space-y-4">
              {[
                { label: "Overall",          keyName: "overallRating" },
                { label: "Work-Life Balance", keyName: "workLifeBalance" },
                { label: "Salary & Benefits", keyName: "salaryBenefits" },
                { label: "Job Security",      keyName: "jobSecurity" },
                { label: "Career Growth",     keyName: "careerGrowth" },
                { label: "Company Culture",   keyName: "companyCulture" },
              ].map(({ label, keyName }) => {
                const vA = (companyA?.[keyName as keyof CompanyResult] as number | null) ?? null;
                const vB = (companyB?.[keyName as keyof CompanyResult] as number | null) ?? null;
                return (
                  <div key={label} className="space-y-1.5">
                    {/* Dimension label */}
                    <span className="text-[10px] font-sans text-warmgray uppercase tracking-wider">{label}</span>

                    {/* Company A row */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans truncate flex-shrink-0 w-24" style={{ color: COLORS.A }}>
                        {offerA.companyName || "Offer A"}
                      </span>
                      <div className="flex-1 h-1.5 bg-ink/6 relative overflow-hidden rounded-full">
                        {vA != null && (
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                            style={{ width: `${(vA / 5) * 100}%`, backgroundColor: COLORS.A }} />
                        )}
                      </div>
                      <span className="text-xs font-bold font-mono flex-shrink-0 w-6 text-right" style={{ color: COLORS.A }}>
                        {vA?.toFixed(1) ?? "—"}
                      </span>
                    </div>

                    {/* Company B row */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans truncate flex-shrink-0 w-24" style={{ color: COLORS.B }}>
                        {offerB.companyName || "Offer B"}
                      </span>
                      <div className="flex-1 h-1.5 bg-ink/6 relative overflow-hidden rounded-full">
                        {vB != null && (
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                            style={{ width: `${(vB / 5) * 100}%`, backgroundColor: COLORS.B }} />
                        )}
                      </div>
                      <span className="text-xs font-bold font-mono flex-shrink-0 w-6 text-right" style={{ color: COLORS.B }}>
                        {vB?.toFixed(1) ?? "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar */}
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="rgba(26,21,4,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#8A7A6A", fontSize: 10, fontFamily: "var(--font-geist-sans)" }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke={COLORS.A} fill={COLORS.A} fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar dataKey="B" stroke={COLORS.B} fill={COLORS.B} fillOpacity={0.15} strokeWidth={1.5} />
                  <Tooltip
                    contentStyle={{ background: "#FDFCF5", border: "1px solid rgba(26,21,4,0.12)", fontSize: 11, fontFamily: "var(--font-geist-sans)" }}
                    labelStyle={{ color: "#1a1504", fontWeight: 600 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Benefits comparison */}
      {allBenefitCats.length > 0 && (
        <div className="bg-white border border-ink/15">
          <div className="px-5 py-2.5 border-b border-ink/10 bg-cream flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Benefits</span>
            <div className="flex gap-4 text-[10px] font-sans">
              <span style={{ color: COLORS.A }}>{offerA.companyName || "A"}</span>
              <span style={{ color: COLORS.B }}>{offerB.companyName || "B"}</span>
            </div>
          </div>
          <div className="divide-y divide-ink/6">
            {allBenefitCats.map((cat) => (
              <div key={cat} className="px-5 py-2 flex items-center justify-between gap-4">
                <span className="text-xs text-warmgray font-sans">{cat}</span>
                <div className="flex gap-6">
                  <span className={`text-sm ${benefitCatsA.has(cat) ? "text-[#4A7C59]" : "text-ink/15"}`}>
                    {benefitCatsA.has(cat) ? "✓" : "—"}
                  </span>
                  <span className={`text-sm ${benefitCatsB.has(cat) ? "text-[#4A7C59]" : "text-ink/15"}`}>
                    {benefitCatsB.has(cat) ? "✓" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry benchmark context */}
      {(companyA?.industry || companyB?.industry) && (
        <div className="px-4 py-3 border border-ink/10 bg-cream text-xs font-sans space-y-1">
          {companyA?.industry && companyA.overallRating != null && (
            <p className="text-warmgray">
              <strong className="text-ink" style={{ color: COLORS.A }}>{offerA.companyName}</strong>{" "}
              rates {companyA.overallRating.toFixed(1)} vs{" "}
              {companyA.industry} industry standard of{" "}
              {getIndustryStandard(companyA.industry).standard.toFixed(1)}.
            </p>
          )}
          {companyB?.industry && companyB.overallRating != null && (
            <p className="text-warmgray">
              <strong className="text-ink" style={{ color: COLORS.B }}>{offerB.companyName}</strong>{" "}
              rates {companyB.overallRating.toFixed(1)} vs{" "}
              {companyB.industry} industry standard of{" "}
              {getIndustryStandard(companyB.industry).standard.toFixed(1)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Offer form ──────────────────────────────────────────────────────────── */

function OfferForm({
  label, color, value, onChange,
}: {
  label: string;
  color: string;
  value: OfferInput;
  onChange: (v: OfferInput) => void;
}) {
  function field(key: keyof OfferInput, val: string | number) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="bg-white border border-ink/15 overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/10 flex items-center gap-2" style={{ backgroundColor: `${color}10`, borderLeftWidth: 3, borderLeftColor: color }}>
        <span className="font-serif font-bold text-ink text-sm">{label}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Company */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-warmgray font-sans mb-1">Company</label>
          <CompanySearch
            value={value}
            onChange={onChange}
            placeholder="Search company…"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-warmgray font-sans mb-1">Role / Designation</label>
          <input
            type="text"
            value={value.role}
            onChange={(e) => field("role", e.target.value)}
            placeholder="e.g. Software Engineer II"
            className="w-full px-3 py-2 border border-ink/20 bg-white text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-warmgray font-sans mb-1">City</label>
          <select
            value={value.city}
            onChange={(e) => field("city", e.target.value)}
            className="w-full px-3 py-2 border border-ink/20 bg-white text-ink text-sm font-sans focus:outline-none focus:border-terracotta"
          >
            {CITY_NAMES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Salary inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "baseSalary" as const,  label: "Base Salary (₹ / year)", placeholder: "e.g. 800000",  required: true  },
            { key: "annualBonus" as const,  label: "Annual Bonus (₹)",       placeholder: "e.g. 100000",  required: false },
            { key: "joiningBonus" as const, label: "Joining Bonus (₹)",      placeholder: "e.g. 200000",  required: false },
          ].map(({ key, label: lbl, placeholder, required }) => (
            <div key={key}>
              <label className="block text-[10px] uppercase tracking-wider text-warmgray font-sans mb-1">
                {lbl}{required && <span className="text-terracotta ml-0.5">*</span>}
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={value[key]}
                onChange={(e) => field(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-ink/20 bg-white text-ink text-sm font-sans focus:outline-none focus:border-terracotta placeholder:text-warmgray/50"
              />
            </div>
          ))}
        </div>

        {/* WFH slider */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-[10px] uppercase tracking-wider text-warmgray font-sans">WFH Days / Week</label>
            <span className="text-xs font-bold font-mono text-ink">{value.wfhDays}d</span>
          </div>
          <input
            type="range"
            min={0} max={5} step={1}
            value={value.wfhDays}
            onChange={(e) => field("wfhDays", parseInt(e.target.value))}
            className="w-full accent-terracotta"
          />
          <div className="flex justify-between text-[9px] text-warmgray/50 font-sans mt-0.5">
            <span>0 (Office)</span><span>5 (Full remote)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function OfferComparisonPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [offerA, setOfferA] = useState<OfferInput>({ ...EMPTY_OFFER, city: "Bangalore" });
  const [offerB, setOfferB] = useState<OfferInput>({ ...EMPTY_OFFER, city: "Bangalore" });
  const [companyA, setCompanyA] = useState<CompanyResult | null>(null);
  const [companyB, setCompanyB] = useState<CompanyResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [priorities, setPriorities] = useState<Record<PriorityKey, number>>({ ...DEFAULT_PRIORITIES });

  // Fetch full company data when slugs are set
  useEffect(() => {
    if (!offerA.companySlug) { setCompanyA(null); return; }
    fetch(`/api/company/${offerA.companySlug}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setCompanyA)
      .catch(() => setCompanyA(null));
  }, [offerA.companySlug]);

  useEffect(() => {
    if (!offerB.companySlug) { setCompanyB(null); return; }
    fetch(`/api/company/${offerB.companySlug}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setCompanyB)
      .catch(() => setCompanyB(null));
  }, [offerB.companySlug]);

  const canProceedA = !!offerA.companySlug && !!parseRupees(offerA.baseSalary);
  const canProceedB = !!offerB.companySlug && !!parseRupees(offerB.baseSalary);

  function goToResults() {
    setLoadingResult(true);
    setTimeout(() => { setLoadingResult(false); setStep(3); }, 400);
  }

  const STEPS = [
    { n: 1 as const, label: "Offer A" },
    { n: 2 as const, label: "Offer B" },
    { n: 3 as const, label: "Results" },
  ];

  return (
    <DashboardShell role="job-seeker">
      <div className="bg-cream min-h-screen">

        {/* Page header */}
        <div className="border-b-2 border-ink/20 px-5 py-4 bg-cream flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link href="/job-seeker/compare" className="text-xs text-warmgray hover:text-terracotta font-sans">
                ← Compare
              </Link>
            </div>
            <h1 className="font-serif font-bold text-ink text-2xl leading-tight">Offer Comparison</h1>
            <p className="text-xs text-warmgray font-sans mt-0.5">
              Compare two job offers with cost of living adjustment and company data.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-ink/10 bg-cream flex items-center gap-0">
          {STEPS.map(({ n, label }, i) => (
            <div key={n} className="flex items-center">
              <button
                onClick={() => n < step || (n === 2 && canProceedA) ? setStep(n) : undefined}
                className={`flex items-center gap-1.5 text-xs font-sans transition-colors ${
                  step === n ? "text-terracotta" : n < step ? "text-warmgray hover:text-ink cursor-pointer" : "text-warmgray/30 cursor-default"
                }`}
              >
                <span className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-bold ${
                  step === n ? "border-terracotta bg-terracotta text-white"
                  : n < step ? "border-ink/30 text-ink/60"
                  : "border-ink/10 text-ink/20"
                }`}>{n}</span>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-px w-8 ${n < step ? "bg-ink/20" : "bg-ink/8"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="p-5 max-w-3xl">
          <AnimatePresence mode="wait">

            {/* Step 1: Offer A */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <OfferForm label="Offer A" color={COLORS.A} value={offerA} onChange={setOfferA} />
                <div className="flex justify-end pb-24 md:pb-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedA}
                    className="px-6 py-2.5 text-xs uppercase tracking-[0.1em] font-sans bg-ink text-cream hover:bg-terracotta transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next: Offer B →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Offer B */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <OfferForm label="Offer B" color={COLORS.B} value={offerB} onChange={setOfferB} />

                {/* Priority weights */}
                <div className="bg-white border border-ink/15">
                  <div className="px-5 py-2.5 border-b border-ink/10 bg-cream">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Your Priorities</p>
                    <p className="text-[11px] text-warmgray font-sans mt-0.5">Tell us what matters most to you. Drag the sliders to weight each factor.</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {PRIORITY_LABELS.map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm w-5 text-center flex-shrink-0 leading-none">{icon}</span>
                        <span className="text-xs font-sans text-warmgray flex-shrink-0 w-28 truncate">{label}</span>
                        <input
                          type="range"
                          min={1} max={5} step={1}
                          value={priorities[key]}
                          onChange={(e) => setPriorities((p) => ({ ...p, [key]: parseInt(e.target.value) }))}
                          className="flex-1 min-w-0 accent-terracotta"
                        />
                        <span className="w-5 text-center text-xs font-bold font-mono text-terracotta flex-shrink-0">
                          {priorities[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pb-24 md:pb-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 text-xs uppercase tracking-[0.1em] font-sans text-warmgray hover:text-ink transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={goToResults}
                    disabled={!canProceedB || loadingResult}
                    className="px-6 py-2.5 text-xs uppercase tracking-[0.1em] font-sans bg-ink text-cream hover:bg-terracotta transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loadingResult ? "Calculating…" : "See Results →"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Results */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-2 pb-24 md:pb-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-warmgray font-sans">
                    <span style={{ color: COLORS.A }} className="font-medium">{offerA.companyName}</span>
                    {" "}vs{" "}
                    <span style={{ color: COLORS.B }} className="font-medium">{offerB.companyName}</span>
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[10px] uppercase tracking-[0.1em] text-warmgray hover:text-terracotta font-sans transition-colors"
                  >
                    ← Start over
                  </button>
                </div>

                <ResultsView
                  offerA={offerA}
                  offerB={offerB}
                  companyA={companyA}
                  companyB={companyB}
                  priorities={priorities}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  );
}
