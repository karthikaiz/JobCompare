"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Reorder, motion, useInView } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { useCompare } from "@/context/compare-context";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface CompanyDetail {
  slug: string; name: string; industry: string | null;
  headquarters: string | null; employeeCount: string | null;
  overallRating: number | null;
  workLifeBalance: number | null; salaryBenefits: number | null;
  jobSecurity: number | null; careerGrowth: number | null; companyCulture: number | null;
  reviews: Array<{ sentiment: string | null }>;
  salaries: Array<{ role: string; minSalary: number; maxSalary: number; avgSalary: number | null }>;
  benefits: Array<{ category: string; name: string }>;
}

// Editorial-friendly company colors: terracotta, forest green, soft purple
const COLORS = ["#C4714A", "#4A7C59", "#7B6FA0"];

const TOOLTIP_STYLE = {
  backgroundColor: "#FDFCF5",
  border: "1px solid rgba(26,21,4,0.12)",
  borderRadius: "4px",
  color: "#1a1504",
};

function formatLakhs(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function ECard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`bg-white border border-ink/15 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ECardHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 border-b border-ink/10 flex items-center justify-between bg-cream flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-terracotta/30" />
          <span className="w-2 h-2 rounded-full bg-terracotta/20" />
          <span className="w-2 h-2 rounded-full bg-terracotta/10" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">{label}</span>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export default function ComparePage() {
  const { companies: selected, removeCompany } = useCompare();
  const [data, setData] = useState<CompanyDetail[]>([]);
  const [orderedData, setOrderedData] = useState<CompanyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (selected.length === 0) { setLoading(false); return; }
    async function fetchAll() {
      const results = await Promise.all(
        selected.map(async (c) => {
          const res = await fetch(`/api/company/${c.slug}`);
          if (!res.ok) return null;
          return res.json();
        })
      );
      const filtered = results.filter(Boolean) as CompanyDetail[];
      setData(filtered);
      setOrderedData(filtered);
      setLoading(false);
    }
    fetchAll();
  }, [selected]);

  if (selected.length < 2 && !loading) {
    return (
      <DashboardShell role="job-seeker">
        <div className="bg-cream min-h-screen p-6 text-center py-20 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-4 h-px bg-terracotta" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">Compare Companies</span>
            <span className="w-4 h-px bg-terracotta" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink">Select companies to compare</h1>
          <p className="text-warmgray text-sm font-sans">Browse companies and click &ldquo;+ Compare&rdquo; to add them.</p>
          {selected.length === 1 && (
            <p className="text-sm text-warmgray font-sans">
              <strong className="text-ink">{selected[0].name}</strong> selected — add one more.
            </p>
          )}
          <div className="flex justify-center mt-6">
            <SearchBar basePath="/job-seeker" placeholder="Search a company to add..." />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const ratingData = [
    { metric: "Overall", ...Object.fromEntries(data.map((d) => [d.name, d.overallRating ?? 0])) },
    { metric: "Work-Life", ...Object.fromEntries(data.map((d) => [d.name, d.workLifeBalance ?? 0])) },
    { metric: "Salary", ...Object.fromEntries(data.map((d) => [d.name, d.salaryBenefits ?? 0])) },
    { metric: "Security", ...Object.fromEntries(data.map((d) => [d.name, d.jobSecurity ?? 0])) },
    { metric: "Growth", ...Object.fromEntries(data.map((d) => [d.name, d.careerGrowth ?? 0])) },
    { metric: "Culture", ...Object.fromEntries(data.map((d) => [d.name, d.companyCulture ?? 0])) },
  ];

  const radarData = [
    { axis: isMobile ? "Work-Life" : "Work-Life Balance", ...Object.fromEntries(data.map((d) => [d.name, d.workLifeBalance ?? 0])) },
    { axis: isMobile ? "Salary" : "Salary & Benefits", ...Object.fromEntries(data.map((d) => [d.name, d.salaryBenefits ?? 0])) },
    { axis: isMobile ? "Security" : "Job Security", ...Object.fromEntries(data.map((d) => [d.name, d.jobSecurity ?? 0])) },
    { axis: isMobile ? "Growth" : "Career Growth", ...Object.fromEntries(data.map((d) => [d.name, d.careerGrowth ?? 0])) },
    { axis: "Culture", ...Object.fromEntries(data.map((d) => [d.name, d.companyCulture ?? 0])) },
  ];

  const roleSalaryMap: Record<string, Record<string, number>> = {};
  for (const company of data) {
    for (const s of company.salaries) {
      if (!roleSalaryMap[s.role]) roleSalaryMap[s.role] = {};
      roleSalaryMap[s.role][company.name] = s.avgSalary ?? Math.round((s.minSalary + s.maxSalary) / 2);
    }
  }
  const salaryData = Object.entries(roleSalaryMap)
    .filter(([, companies]) => Object.keys(companies).length >= 2 || data.length < 2)
    .slice(0, 8)
    .map(([role, companies]) => {
      const maxLen = isMobile ? 14 : 22;
      return { role: role.length > maxLen ? role.slice(0, maxLen - 2) + "..." : role, ...companies };
    });

  const sentimentData = data.map((d) => {
    const pos = d.reviews.filter((r) => r.sentiment === "positive").length;
    const neg = d.reviews.filter((r) => r.sentiment === "negative").length;
    const neu = d.reviews.filter((r) => r.sentiment === "neutral").length;
    const total = pos + neg + neu || 1;
    return {
      name: d.name,
      Positive: Math.round((pos / total) * 100),
      Negative: Math.round((neg / total) * 100),
      Neutral: Math.round((neu / total) * 100),
    };
  });

  return (
    <DashboardShell role="job-seeker">
      <div className="bg-cream min-h-screen p-4 space-y-4 pb-24">
        {/* Header: draggable company badges */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="border-b-2 border-ink/15 pb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-4 h-px bg-terracotta" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">
              Company Comparison — drag to reorder
            </span>
          </div>
          <Reorder.Group axis="x" values={selected} onReorder={() => {}} className="flex flex-wrap gap-2">
            {selected.map((c, i) => (
              <Reorder.Item key={c.slug} value={c} className="cursor-grab active:cursor-grabbing">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 border text-sm font-medium font-sans"
                  style={{ backgroundColor: COLORS[i] + "18", color: COLORS[i], borderColor: COLORS[i] + "50" }}
                >
                  {c.name}
                  <button
                    onClick={() => removeCompany(c.slug)}
                    className="ml-1 hover:opacity-60 w-4 h-4 inline-flex items-center justify-center"
                  >
                    &times;
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </motion.div>

        {loading ? (
          <div className="text-center py-20 text-warmgray font-sans text-sm">Loading comparison data...</div>
        ) : data.length < 2 ? (
          <div className="text-center py-20 text-warmgray font-sans">
            <p>Could not load data for all selected companies.</p>
          </div>
        ) : (
          <>
            {/* Company summary columns */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
              {orderedData.map((company, i) => {
                const colorIdx = data.findIndex((d) => d.slug === company.slug);
                const color = COLORS[colorIdx >= 0 ? colorIdx : i];
                return (
                  <motion.div
                    key={company.slug}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.45, ease: "easeOut" }}
                    className="bg-white border border-ink/15 overflow-hidden"
                  >
                    <div className="h-1 w-full" style={{ backgroundColor: color }} />
                    <div className="p-4">
                      <Link href={`/job-seeker/${company.slug}`} className="hover:underline">
                        <div className="font-serif font-bold text-base leading-tight" style={{ color }}>{company.name}</div>
                      </Link>
                      <div className="text-xs text-warmgray mt-1 space-y-0.5 font-sans">
                        {company.industry && <div>{company.industry}</div>}
                        {company.headquarters && <div>{company.headquarters}</div>}
                        {company.employeeCount && <div>{company.employeeCount}</div>}
                      </div>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono" style={{ color }}>
                          {company.overallRating?.toFixed(1) ?? "—"}
                        </span>
                        <span className="text-xs text-warmgray font-sans">/5.0</span>
                      </div>
                      <div className="mt-1.5 flex gap-3 text-xs text-warmgray font-sans">
                        <span>{company.reviews.length} reviews</span>
                        <span>{company.salaries.length} salaries</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Ratings comparison */}
            <ECard delay={0.1}>
              <ECardHeader label="Ratings Comparison" />
              <div className="p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingData} margin={{ left: 0, right: 10 }}>
                    <XAxis dataKey="metric" tick={{ fontSize: isMobile ? 10 : 12, fill: "#6b6559" }} interval={0} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#6b6559" }} width={isMobile ? 30 : 40} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#6b6559" }} labelStyle={{ color: "#C4714A", fontWeight: 600 }} />
                    <Legend wrapperStyle={{ color: "#6b6559", fontFamily: "var(--font-geist-sans)", fontSize: "11px" }} />
                    {data.map((d, i) => (
                      <Bar key={d.slug} dataKey={d.name} fill={COLORS[i]} radius={[4, 4, 0, 0]} barSize={data.length === 2 ? 30 : 20} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ECard>

            {/* Radar overlay */}
            <ECard delay={0.15}>
              <ECardHeader label="Rating Breakdown Overlay" />
              <div className="p-4">
                <ResponsiveContainer width="100%" height={isMobile ? 260 : 320}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? "55%" : "70%"}>
                    <PolarGrid stroke="rgba(26,21,4,0.08)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "#6b6559", fontSize: isMobile ? 9 : 11 }} />
                    <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: "rgba(26,21,4,0.35)" }} />
                    {data.map((d, i) => (
                      <Radar key={d.slug} dataKey={d.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.10} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ color: "#6b6559", fontFamily: "var(--font-geist-sans)", fontSize: "11px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </ECard>

            {/* Salary comparison */}
            {salaryData.length > 0 && (
              <ECard delay={0.2}>
                <ECardHeader label="Salary Comparison" />
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={Math.max(250, salaryData.length * 50 + 40)}>
                    <BarChart data={salaryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tickFormatter={formatLakhs} tick={{ fontSize: 11, fill: "#6b6559" }} />
                      <YAxis type="category" dataKey="role" width={isMobile ? 70 : 130} tick={{ fontSize: isMobile ? 10 : 11, fill: "#1a1504" }} />
                      <Tooltip formatter={(value) => [formatLakhs(Number(value)) + "/yr", ""]} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#6b6559" }} labelStyle={{ color: "#C4714A", fontWeight: 600 }} />
                      <Legend wrapperStyle={{ color: "#6b6559", fontFamily: "var(--font-geist-sans)", fontSize: "11px" }} />
                      {data.map((d, i) => (
                        <Bar key={d.slug} dataKey={d.name} fill={COLORS[i]} radius={[0, 4, 4, 0]} barSize={16} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ECard>
            )}

            {/* Sentiment breakdown */}
            <ECard delay={0.25}>
              <ECardHeader label="Sentiment Breakdown" />
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sentimentData} margin={{ left: 0, right: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b6559" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b6559" }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, ""]} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "#6b6559" }} />
                    <Legend wrapperStyle={{ color: "#6b6559", fontFamily: "var(--font-geist-sans)", fontSize: "11px" }} />
                    <Bar dataKey="Positive" fill="#4A7C59" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="Neutral" fill="#C4B99A" stackId="a" />
                    <Bar dataKey="Negative" fill="#B05252" radius={[0, 0, 4, 4]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ECard>

            {/* Benefits side-by-side */}
            <ECard delay={0.3}>
              <ECardHeader label="Benefits" />
              <div className="p-4">
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
                  {data.map((company, i) => {
                    const grouped: Record<string, string[]> = {};
                    for (const b of company.benefits) {
                      const cat = b.category || "Other";
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(b.name);
                    }
                    return (
                      <div key={company.slug}>
                        <h4 className="font-serif font-semibold text-sm mb-3" style={{ color: COLORS[i] }}>
                          {company.name} ({company.benefits.length})
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(grouped).map(([cat, names]) => (
                            <div key={cat}>
                              <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1">{cat}</div>
                              <div className="flex flex-wrap gap-1">
                                {names.map((name, j) => (
                                  <span key={j} className="text-[10px] border border-ink/15 text-ink/70 px-1.5 py-0.5 font-sans">{name}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ECard>

            <div className="text-center pb-4">
              <Link href="/job-seeker" className="text-xs uppercase tracking-[0.1em] border border-ink/25 text-warmgray px-4 py-2 hover:border-terracotta hover:text-terracotta transition-colors font-sans inline-block">
                ← Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
