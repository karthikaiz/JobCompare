"use client";

import { INDUSTRY_STANDARDS } from "@/lib/industry-standards-source";

const TIER_STYLES = {
  high:   "text-[#4A7C59]",
  mid:    "text-cream",
  low:    "text-[#C9876E]",
};

function tierOf(standard: number) {
  if (standard >= 3.7) return "high";
  if (standard >= 3.4) return "mid";
  return "low";
}

export default function IndustryStandardsPage() {
  const entries = Object.entries(INDUSTRY_STANDARDS).filter(([key]) => key !== "default");
  const sorted = [...entries].sort((a, b) => b[1].standard - a[1].standard);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-serif font-bold text-cream">Industry Standards</h1>
        <p className="text-sm text-white/40 mt-1">
          Research-backed benchmarks used to contextualise company ratings on the job-seeker dashboard.
          Edit <code className="font-mono text-white/50">src/lib/industry-standards-source.ts</code> to update.
        </p>
      </div>

      {/* Default fallback */}
      <div className="mb-6 px-5 py-3 rounded-sm border border-white/8 bg-white/2 flex items-center gap-4">
        <span className="text-xs uppercase tracking-widest text-white/30 font-sans">Default fallback</span>
        <span className="font-serif font-bold text-cream text-lg ml-auto">
          {INDUSTRY_STANDARDS["default"].standard.toFixed(1)}
        </span>
        <span className="text-xs text-white/30 font-sans">{INDUSTRY_STANDARDS["default"].source}</span>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-white/8 bg-white/2 overflow-hidden">
        <div className="grid grid-cols-[1fr_64px_3fr] gap-0 border-b border-white/8 px-5 py-2">
          <span className="text-[10px] uppercase tracking-widest text-white/25 font-sans">Industry</span>
          <span className="text-[10px] uppercase tracking-widest text-white/25 font-sans text-right">Std</span>
          <span className="text-[10px] uppercase tracking-widest text-white/25 font-sans pl-4">Source / Notes</span>
        </div>

        <div className="divide-y divide-white/5">
          {sorted.map(([industry, data]) => (
            <div
              key={industry}
              className="grid grid-cols-[1fr_64px_3fr] gap-0 px-5 py-3 hover:bg-white/2 transition-colors items-start"
            >
              <span className="text-sm text-cream font-sans">{industry}</span>
              <span className={`text-sm font-bold font-serif text-right ${TIER_STYLES[tierOf(data.standard)]}`}>
                {data.standard.toFixed(1)}
              </span>
              <div className="pl-4 min-w-0">
                <p className="text-xs text-white/40 font-sans leading-relaxed truncate">{data.citation}</p>
                {data.notes && (
                  <p className="text-[11px] text-white/20 font-sans leading-relaxed mt-0.5">{data.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-5">
        <span className="text-[11px] text-white/20 font-sans">Tier colour:</span>
        <span className="text-[11px] text-[#4A7C59] font-sans">≥ 3.7 high</span>
        <span className="text-[11px] text-cream font-sans">3.4 – 3.6 mid</span>
        <span className="text-[11px] text-[#C9876E] font-sans">≤ 3.3 low</span>
        <span className="text-[11px] text-white/20 font-sans ml-auto">
          Last updated: {Math.max(...Object.values(INDUSTRY_STANDARDS).map((d) => d.year))}
        </span>
      </div>
    </div>
  );
}
