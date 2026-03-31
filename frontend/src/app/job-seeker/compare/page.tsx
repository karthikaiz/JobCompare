"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { useCompare } from "@/context/compare-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface CompanyDetail {
  slug: string;
  name: string;
  industry: string | null;
  headquarters: string | null;
  employeeCount: string | null;
  overallRating: number | null;
  workLifeBalance: number | null;
  salaryBenefits: number | null;
  jobSecurity: number | null;
  careerGrowth: number | null;
  companyCulture: number | null;
  reviews: Array<{ sentiment: string | null }>;
  salaries: Array<{
    role: string;
    minSalary: number;
    maxSalary: number;
    avgSalary: number | null;
  }>;
  benefits: Array<{ category: string; name: string }>;
}

const COLORS = ["#3b82f6", "#f97316", "#10b981"];

function formatLakhs(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

export default function ComparePage() {
  const { companies: selected, removeCompany } = useCompare();
  const [data, setData] = useState<CompanyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (selected.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchAll() {
      const results = await Promise.all(
        selected.map(async (c) => {
          const res = await fetch(`/api/company/${c.slug}`);
          if (!res.ok) return null;
          return res.json();
        })
      );
      setData(results.filter(Boolean));
      setLoading(false);
    }
    fetchAll();
  }, [selected]);

  if (selected.length < 2 && !loading) {
    return (
      <DashboardShell role="job-seeker">
        <div className="max-w-4xl mx-auto text-center py-20 space-y-4">
          <h1 className="text-2xl font-bold">Compare Companies</h1>
          <p className="text-muted-foreground">
            Select at least 2 companies to compare. Browse companies and click &ldquo;+ Compare&rdquo; to add them.
          </p>
          {selected.length === 1 && (
            <p className="text-sm">
              You have <strong>{selected[0].name}</strong> selected. Add one more.
            </p>
          )}
          <div className="flex justify-center mt-6">
            <SearchBar basePath="/job-seeker" placeholder="Search a company to add..." />
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Rating comparison data
  const ratingData = [
    { metric: "Overall", ...Object.fromEntries(data.map((d) => [d.name, d.overallRating ?? 0])) },
    { metric: "Work-Life", ...Object.fromEntries(data.map((d) => [d.name, d.workLifeBalance ?? 0])) },
    { metric: "Salary", ...Object.fromEntries(data.map((d) => [d.name, d.salaryBenefits ?? 0])) },
    { metric: "Security", ...Object.fromEntries(data.map((d) => [d.name, d.jobSecurity ?? 0])) },
    { metric: "Growth", ...Object.fromEntries(data.map((d) => [d.name, d.careerGrowth ?? 0])) },
    { metric: "Culture", ...Object.fromEntries(data.map((d) => [d.name, d.companyCulture ?? 0])) },
  ];

  // Radar data
  const radarData = [
    { axis: isMobile ? "Work-Life" : "Work-Life Balance", ...Object.fromEntries(data.map((d) => [d.name, d.workLifeBalance ?? 0])) },
    { axis: isMobile ? "Salary" : "Salary & Benefits", ...Object.fromEntries(data.map((d) => [d.name, d.salaryBenefits ?? 0])) },
    { axis: isMobile ? "Security" : "Job Security", ...Object.fromEntries(data.map((d) => [d.name, d.jobSecurity ?? 0])) },
    { axis: isMobile ? "Growth" : "Career Growth", ...Object.fromEntries(data.map((d) => [d.name, d.careerGrowth ?? 0])) },
    { axis: "Culture", ...Object.fromEntries(data.map((d) => [d.name, d.companyCulture ?? 0])) },
  ];

  // Salary comparison — find common roles
  const roleSalaryMap: Record<string, Record<string, number>> = {};
  for (const company of data) {
    for (const s of company.salaries) {
      if (!roleSalaryMap[s.role]) roleSalaryMap[s.role] = {};
      roleSalaryMap[s.role][company.name] = s.avgSalary ?? Math.round((s.minSalary + s.maxSalary) / 2);
    }
  }
  // Show roles that at least 2 companies share, or top roles
  const salaryData = Object.entries(roleSalaryMap)
    .filter(([, companies]) => Object.keys(companies).length >= 2 || data.length < 2)
    .slice(0, 8)
    .map(([role, companies]) => {
      const maxLen = isMobile ? 14 : 22;
      return {
        role: role.length > maxLen ? role.slice(0, maxLen - 2) + "..." : role,
        ...companies,
      };
    });

  // Sentiment comparison
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Company Comparison</h1>
          <div className="flex flex-wrap gap-2">
            {selected.map((c, i) => (
              <Badge
                key={c.slug}
                className="text-sm px-3 py-1"
                style={{ backgroundColor: COLORS[i] + "20", color: COLORS[i], borderColor: COLORS[i] }}
              >
                {c.name}
                <button onClick={() => removeCompany(c.slug)} className="ml-1.5 hover:opacity-70 min-w-[20px] min-h-[20px] inline-flex items-center justify-center">
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading comparison data...</div>
        ) : data.length < 2 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Could not load data for all selected companies. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Company Overview Cards */}
            <div className={`grid gap-4 grid-cols-1 ${data.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {data.map((company, i) => (
                <Card key={company.slug}>
                  <CardContent className="pt-4 pb-3">
                    <Link href={`/job-seeker/${company.slug}`} className="hover:underline">
                      <h3 className="font-semibold" style={{ color: COLORS[i] }}>
                        {company.name}
                      </h3>
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {company.industry && <div>{company.industry}</div>}
                      {company.headquarters && <div>{company.headquarters}</div>}
                      {company.employeeCount && <div>{company.employeeCount} employees</div>}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: COLORS[i] }}>
                        {company.overallRating?.toFixed(1) ?? "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">/5.0</span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      <span>{company.reviews.length} reviews</span>
                      <span>{company.salaries.length} salaries</span>
                      <span>{company.benefits.length} benefits</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rating Comparison Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ratings Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingData} margin={{ left: 0, right: 10 }}>
                    <XAxis dataKey="metric" tick={{ fontSize: isMobile ? 10 : 12 }} interval={0} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} width={isMobile ? 30 : 40} />
                    <Tooltip />
                    <Legend />
                    {data.map((d, i) => (
                      <Bar
                        key={d.slug}
                        dataKey={d.name}
                        fill={COLORS[i]}
                        radius={[4, 4, 0, 0]}
                        barSize={data.length === 2 ? 30 : 20}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Overlay */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rating Breakdown Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 260 : 320}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? "55%" : "70%"}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "#6b7280", fontSize: isMobile ? 9 : 11 }} />
                    <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    {data.map((d, i) => (
                      <Radar
                        key={d.slug}
                        dataKey={d.name}
                        stroke={COLORS[i]}
                        fill={COLORS[i]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Salary Comparison */}
            {salaryData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Salary Comparison (Avg by Role)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(250, salaryData.length * 50 + 40)}>
                    <BarChart data={salaryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tickFormatter={formatLakhs} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="role" width={isMobile ? 70 : 130} tick={{ fontSize: isMobile ? 10 : 11 }} />
                      <Tooltip formatter={(value) => [formatLakhs(Number(value)) + "/yr", ""]} />
                      <Legend />
                      {data.map((d, i) => (
                        <Bar key={d.slug} dataKey={d.name} fill={COLORS[i]} radius={[0, 4, 4, 0]} barSize={16} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Sentiment Comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Review Sentiment (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sentimentData} margin={{ left: 0, right: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, ""]} />
                    <Legend />
                    <Bar dataKey="Positive" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="Neutral" fill="#9ca3af" radius={[0, 0, 0, 0]} stackId="a" />
                    <Bar dataKey="Negative" fill="#ef4444" radius={[0, 0, 4, 4]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Benefits Side-by-Side */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Benefits Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 grid-cols-1 ${data.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                  {data.map((company, i) => {
                    const grouped: Record<string, string[]> = {};
                    for (const b of company.benefits) {
                      const cat = b.category || "Other";
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(b.name);
                    }
                    return (
                      <div key={company.slug}>
                        <h4 className="font-medium text-sm mb-2" style={{ color: COLORS[i] }}>
                          {company.name} ({company.benefits.length})
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(grouped).map(([cat, names]) => (
                            <div key={cat}>
                              <div className="text-xs text-muted-foreground capitalize">{cat}</div>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {names.map((name, j) => (
                                  <Badge key={j} variant="outline" className="text-xs font-normal">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Back Button */}
            <div className="text-center pb-6">
              <Button variant="outline" asChild>
                <Link href="/job-seeker">Back to Dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
