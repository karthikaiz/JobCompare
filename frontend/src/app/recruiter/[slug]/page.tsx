"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { ThemeBarChart } from "@/components/charts/theme-bar-chart";
import { ReviewCard } from "@/components/charts/review-card";
import { RatingGauge } from "@/components/charts/rating-gauge";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyData {
  id: string;
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
  lastScrapedAt: string | null;
  reviews: Array<{
    id: string; title: string | null; role: string | null; location: string | null;
    rating: number | null; pros: string; cons: string; sentiment: string | null;
    sentimentScore: number | null; isCurrentEmployee: boolean | null; reviewDate: string | null;
  }>;
  salaries: Array<{ role: string; minSalary: number; maxSalary: number; avgSalary: number | null }>;
  benefits: Array<{ category: string; name: string }>;
  sentiment: {
    positiveCount: number; negativeCount: number; neutralCount: number;
    topPositiveThemes: string[]; topNegativeThemes: string[];
  } | null;
}

interface CompetitorSummary {
  slug: string; name: string; overallRating: number | null;
  industry: string | null; _count: { reviews: number };
}

/* ── Editorial card primitives ── */
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
    <div className="px-4 py-2.5 border-b border-ink/10 bg-cream flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-terracotta/30" />
            <span className="w-2 h-2 rounded-full bg-terracotta/20" />
            <span className="w-2 h-2 rounded-full bg-terracotta/10" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">{label}</span>
        </div>
        {children && <div className="hidden sm:flex items-center gap-1.5">{children}</div>}
      </div>
      {children && <div className="sm:hidden flex flex-wrap items-center gap-1 mt-2">{children}</div>}
    </div>
  );
}

/* ── Animated rating bar ── */
function RatingBar({ label, value, delay = 0 }: { label: string; value: number | null; delay?: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setWidth(value != null ? (value / 5) * 100 : 0), delay);
    return () => clearTimeout(t);
  }, [inView, value, delay]);
  return (
    <div ref={ref} className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-warmgray font-sans">{label}</span>
        <span className="text-xs font-bold font-mono text-ink">{value?.toFixed(1) ?? "—"}</span>
      </div>
      <div className="h-1 bg-ink/8 overflow-hidden">
        <div className="h-full bg-terracotta transition-all duration-1000 ease-out" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/* ── Filter pill ── */
function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-2.5 py-0.5 text-xs font-sans border transition-colors ${active ? "bg-terracotta border-terracotta text-white" : "border-ink/20 text-warmgray hover:border-terracotta hover:text-terracotta"}`}>
      {children}
    </button>
  );
}

export default function RecruiterCompanyPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<"all" | "current" | "former">("all");
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/company/${slug}`);
        if (res.status === 404) { setError("Company not found"); return; }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCompany(data);
        if (data.industry) {
          try {
            const compRes = await fetch(`/api/companies?industry=${encodeURIComponent(data.industry)}&limit=6`);
            if (compRes.ok) {
              const compData = await compRes.json();
              setCompetitors((compData.companies || []).filter((c: CompetitorSummary) => c.slug !== slug));
            }
          } catch { /* optional */ }
        }
      } catch {
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const reviews = company?.reviews ?? [];

  // Roles scoped to current location selection
  const availableRoles = Array.from(new Set(
    reviews.filter((r) => !locationFilter || r.location === locationFilter).map((r) => r.role).filter(Boolean) as string[]
  )).sort();

  // Locations scoped to current role selection
  const availableLocations = Array.from(new Set(
    reviews.filter((r) => !roleFilter || r.role === roleFilter).map((r) => r.location).filter(Boolean) as string[]
  )).sort();

  const filteredReviews = reviews
    .filter((r) => {
      if (sentimentFilter !== "all" && r.sentiment !== sentimentFilter) return false;
      if (roleFilter && r.role !== roleFilter) return false;
      if (locationFilter && r.location !== locationFilter) return false;
      if (employeeFilter === "current" && r.isCurrentEmployee !== true) return false;
      if (employeeFilter === "former" && r.isCurrentEmployee !== false) return false;
      return true;
    })
    .sort((a, b) => {
      const wordCount = (r: typeof a) => ((r.pros || "") + " " + (r.cons || "")).split(/\s+/).filter(Boolean).length;
      const lenA = wordCount(a), lenB = wordCount(b);
      const longA = lenA >= 20 ? 1 : 0, longB = lenB >= 20 ? 1 : 0;
      if (longB !== longA) return longB - longA;  // long bucket first
      const yearA = a.reviewDate ? new Date(a.reviewDate).getFullYear() : 0;
      const yearB = b.reviewDate ? new Date(b.reviewDate).getFullYear() : 0;
      if (yearB !== yearA) return yearB - yearA;  // newest year first
      return lenB - lenA;                          // longer content first
    });

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 8);

  const posCount = company?.sentiment?.positiveCount ?? company?.reviews.filter((r) => r.sentiment === "positive").length ?? 0;
  const negCount = company?.sentiment?.negativeCount ?? company?.reviews.filter((r) => r.sentiment === "negative").length ?? 0;
  const neuCount = company?.sentiment?.neutralCount ?? company?.reviews.filter((r) => r.sentiment === "neutral").length ?? 0;
  const totalSentiment = posCount + negCount;

  return (
    <DashboardShell role="recruiter">
      {loading && (
        <div className="bg-cream min-h-screen p-6 space-y-4">
          <Skeleton className="h-12 w-full bg-ink/10" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 bg-ink/10" />
            <Skeleton className="h-64 bg-ink/10" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-cream min-h-screen p-6 text-center py-20">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">{error}</h2>
          <p className="text-warmgray text-sm mb-6 font-sans">Try searching for a different company.</p>
          <SearchBar basePath="/recruiter" />
        </div>
      )}

      {company && (
        <div className="bg-cream min-h-screen">
          {/* Header strip */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="border-b-2 border-ink/20 px-5 py-4 flex flex-wrap items-start justify-between gap-4 bg-cream"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
                  className="font-serif font-bold text-ink text-2xl sm:text-3xl leading-tight"
                >
                  {company.name}
                </motion.h1>
                {company.industry && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-[10px] uppercase tracking-[0.14em] border border-ink/30 text-warmgray px-2 py-0.5 font-sans"
                  >
                    {company.industry}
                  </motion.span>
                )}
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 border border-terracotta/40 text-terracotta font-sans"
                >
                  Recruiter View
                </motion.span>
              </div>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="flex flex-wrap items-center gap-3 text-xs text-warmgray font-sans"
              >
                {company.headquarters && <span>{company.headquarters}</span>}
                {company.employeeCount && <span>· {company.employeeCount}</span>}
                {company.lastScrapedAt && (
                  <span>· Updated {new Date(company.lastScrapedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                )}
              </motion.div>
            </div>
          </motion.div>

          <div className="p-4 space-y-4">
            {/* Top row: Sentiment (40%) + Rating (60%) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <ECard delay={0.1} className="md:col-span-2">
                <ECardHeader label="Employee Sentiment" />
                <div className="p-4">
                  <SentimentDonut positive={posCount} negative={negCount} neutral={neuCount} />
                </div>
              </ECard>
              <ECard delay={0.15} className="md:col-span-3">
                <ECardHeader label="Ratings" />
                <div className="p-4 flex flex-col sm:flex-row gap-6">
                  {company.overallRating != null ? (
                    <RatingGauge rating={company.overallRating} size="md" />
                  ) : (
                    <p className="text-warmgray text-sm py-4 font-sans">No rating</p>
                  )}
                  <div className="flex-1 space-y-3">
                    {[
                      { label: "Work-Life Balance", value: company.workLifeBalance, delay: 0 },
                      { label: "Salary & Benefits", value: company.salaryBenefits, delay: 80 },
                      { label: "Job Security", value: company.jobSecurity, delay: 160 },
                      { label: "Career Growth", value: company.careerGrowth, delay: 240 },
                      { label: "Company Culture", value: company.companyCulture, delay: 320 },
                    ].map((item) => (
                      <RatingBar key={item.label} label={item.label} value={item.value} delay={item.delay} />
                    ))}
                  </div>
                </div>
              </ECard>
            </div>

            {/* Theme analysis row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ECard delay={0.2}>
                <ECardHeader label="What People Like" />
                <div className="p-4">
                  <ThemeBarChart themes={company.sentiment?.topPositiveThemes ?? []} reviews={company.reviews} type="positive" />
                </div>
              </ECard>
              <ECard delay={0.25}>
                <ECardHeader label="Why People Leave" />
                <div className="p-4">
                  <ThemeBarChart themes={company.sentiment?.topNegativeThemes ?? []} reviews={company.reviews} type="negative" />
                </div>
              </ECard>
            </div>

            {/* Key metrics strip */}
            <ECard delay={0.3}>
              <ECardHeader label="Key Metrics" />
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-ink/8">
                <div className="flex flex-col items-center py-4">
                  <span className="text-[#4A7C59] font-mono font-bold text-xl">{posCount}</span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Positive</span>
                </div>
                <div className="flex flex-col items-center py-4">
                  <span className="text-[#B05252] font-mono font-bold text-xl">{negCount}</span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Negative</span>
                </div>
                <div className="flex flex-col items-center py-4">
                  <span className="font-mono font-bold text-xl text-ink">{company.reviews.length}</span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Reviews</span>
                </div>
                <div className="flex flex-col items-center py-4">
                  <span className="font-mono font-bold text-xl text-ink">{company.salaries.length}</span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Salaries</span>
                </div>
                <div className="sm:col-span-1 col-span-2 flex flex-col justify-center px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mb-1.5">Satisfaction</div>
                  {totalSentiment > 0 ? (
                    <>
                      <div className="w-full bg-ink/8 h-1.5 overflow-hidden flex">
                        <div className="bg-[#4A7C59] h-full transition-all duration-1000" style={{ width: `${Math.round((posCount / totalSentiment) * 100)}%` }} />
                        <div className="bg-[#B05252] h-full transition-all duration-1000" style={{ width: `${Math.round((negCount / totalSentiment) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] mt-1 text-warmgray font-sans">
                        <span>{Math.round((posCount / totalSentiment) * 100)}% pos</span>
                        <span>{Math.round((negCount / totalSentiment) * 100)}% neg</span>
                      </div>
                    </>
                  ) : <span className="text-warmgray text-xs font-sans">No data</span>}
                </div>
              </div>
            </ECard>

            {/* Competitors */}
            {competitors.length > 0 && (
              <ECard delay={0.35}>
                <ECardHeader label="Industry Competitors" />
                <div className="p-4">
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {competitors.map((comp) => (
                      <Link
                        key={comp.slug}
                        href={`/recruiter/${comp.slug}`}
                        className="flex-shrink-0 p-3 border border-ink/15 hover:border-terracotta/40 hover:bg-terracotta/3 transition-colors text-center min-w-[110px] group"
                      >
                        <div className="font-medium text-sm truncate text-ink font-sans">{comp.name}</div>
                        <div className="text-xl font-bold font-mono text-terracotta mt-1">{comp.overallRating?.toFixed(1) ?? "—"}</div>
                        <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-0.5 font-sans">{comp._count.reviews} reviews</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </ECard>
            )}

            {/* Reviews */}
            <ECard delay={0.4}>
              <ECardHeader label={`Employee Reviews (${filteredReviews.length})`}>
                <div className="flex flex-wrap gap-1 items-center">
                  {/* Role dropdown — options scoped to current location */}
                  {availableRoles.length > 1 && (
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value); setLocationFilter(""); setShowAllReviews(false); }}
                      className="text-[10px] uppercase tracking-[0.08em] border border-ink/20 text-warmgray bg-cream px-2 py-0.5 font-sans focus:outline-none focus:border-terracotta hover:border-terracotta transition-colors cursor-pointer"
                    >
                      <option value="">All Roles</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>{role.length > 40 ? role.slice(0, 38) + "..." : role}</option>
                      ))}
                    </select>
                  )}
                  {/* Location dropdown — options scoped to current role */}
                  {availableLocations.length > 1 && (
                    <select
                      value={locationFilter}
                      onChange={(e) => { setLocationFilter(e.target.value); setRoleFilter(""); setShowAllReviews(false); }}
                      className="text-[10px] uppercase tracking-[0.08em] border border-ink/20 text-warmgray bg-cream px-2 py-0.5 font-sans focus:outline-none focus:border-terracotta hover:border-terracotta transition-colors cursor-pointer"
                    >
                      <option value="">All Locations</option>
                      {availableLocations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  )}
                  {(availableRoles.length > 1 || availableLocations.length > 1) && (
                    <span className="text-ink/20 text-xs">|</span>
                  )}
                  {(["all", "positive", "negative", "neutral"] as const).map((f) => (
                    <FilterPill key={f} active={sentimentFilter === f} onClick={() => { setSentimentFilter(f); setShowAllReviews(false); }}>
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </FilterPill>
                  ))}
                  <span className="text-ink/20 text-xs">|</span>
                  {(["all", "current", "former"] as const).map((f) => (
                    <FilterPill key={f} active={employeeFilter === f} onClick={() => { setEmployeeFilter(f); setShowAllReviews(false); }}>
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </FilterPill>
                  ))}
                </div>
              </ECardHeader>
              <div className="p-4 space-y-3">
                {displayedReviews.length === 0 ? (
                  <p className="text-sm text-warmgray text-center py-4 font-sans">No reviews match your filters</p>
                ) : (
                  <>
                    {displayedReviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                      >
                        <ReviewCard key={review.id} review={review} />
                      </motion.div>
                    ))}
                    {!showAllReviews && filteredReviews.length > 8 && (
                      <div className="text-center pt-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowAllReviews(true)}
                          className="text-xs uppercase tracking-[0.1em] border border-ink/25 text-warmgray px-4 py-2 hover:border-terracotta hover:text-terracotta transition-colors font-sans"
                        >
                          Show all {filteredReviews.length} reviews
                        </motion.button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ECard>

            <div className="text-center pb-4">
              <Link href="/recruiter" className="text-xs uppercase tracking-[0.1em] border border-ink/25 text-warmgray px-4 py-2 hover:border-terracotta hover:text-terracotta transition-colors font-sans inline-block">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
