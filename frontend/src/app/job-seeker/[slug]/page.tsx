"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { RatingGauge } from "@/components/charts/rating-gauge";
import { BenefitsRadar } from "@/components/charts/benefits-radar";
import { SalaryChart } from "@/components/charts/salary-chart";
import { BenefitsBadges } from "@/components/charts/benefits-badges";
import { ReviewCard } from "@/components/charts/review-card";
import { ReviewForm } from "@/components/review-form";
import { SalaryForm } from "@/components/salary-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompare } from "@/context/compare-context";
import { useAuth } from "@/context/auth-context";

/* ── Types ── */
interface ScrapedReview {
  id: string; title: string | null; role: string | null; location: string | null;
  rating: number | null; pros: string; cons: string; sentiment: string | null;
  sentimentScore: number | null; isCurrentEmployee: boolean | null; reviewDate: string | null;
}
interface UserReview {
  id: string; title: string; role: string; location: string | null;
  overallRating: number; pros: string; cons: string; isAnonymous: boolean;
  isCurrentEmployee: boolean; upvotes: number; createdAt: string;
  user: { displayName: string | null };
}
interface CompanyData {
  id: string; slug: string; name: string; industry: string | null;
  headquarters: string | null; employeeCount: string | null; founded: number | null;
  website: string | null; overallRating: number | null; workLifeBalance: number | null;
  salaryBenefits: number | null; jobSecurity: number | null; careerGrowth: number | null;
  companyCulture: number | null; source: string; lastScrapedAt: string | null;
  reviews: ScrapedReview[];
  userReviews: UserReview[];
  salaries: Array<{ role: string; minSalary: number; maxSalary: number; avgSalary: number | null; currency: string; experience: string | null; sampleCount: number | null }>;
  userSalaries: Array<{ id: string; role: string; location: string | null; baseSalary: number; totalComp: number | null; experience: string | null }>;
  benefits: Array<{ category: string; name: string; details: string | null }>;
  sentiment: { positiveCount: number; negativeCount: number; neutralCount: number; topPositiveThemes: string[]; topNegativeThemes: string[] } | null;
}
interface UnifiedReview {
  id: string; title: string | null; role: string | null; location: string | null;
  rating: number | null; pros: string; cons: string; sentiment: string | null;
  sentimentScore: number | null; isCurrentEmployee: boolean | null; reviewDate: string | null;
  source: "scraped" | "community"; upvotes?: number; authorName?: string | null;
}

/* ── Editorial primitives ── */
function ECard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`bg-white border border-ink/20 overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ECardHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 border-b border-ink/10 flex items-center justify-between bg-cream flex-shrink-0">
      <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">{label}</span>
      {children && <div className="flex items-center gap-1.5">{children}</div>}
    </div>
  );
}

function ECardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
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
        <div
          className="h-full bg-terracotta transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ── Animated counter ── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / 1000, 1);
          setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Sentiment bar ── */
function SentimentBar({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const total = positive + negative + neutral || 1;
  const posW = Math.round((positive / total) * 100);
  const negW = Math.round((negative / total) * 100);
  const neuW = 100 - posW - negW;
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => { if (inView) setTimeout(() => setMounted(true), 100); }, [inView]);

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex h-2 gap-0.5 overflow-hidden">
        <div className="bg-[#5C8A5C] h-full transition-all duration-1000 ease-out" style={{ width: mounted ? `${posW}%` : "0%" }} />
        <div className="bg-ink/15 h-full transition-all duration-1000 ease-out" style={{ width: mounted ? `${neuW}%` : "0%" }} />
        <div className="bg-[#B05252] h-full transition-all duration-1000 ease-out" style={{ width: mounted ? `${negW}%` : "0%" }} />
      </div>
      <div className="flex gap-4 text-[10px] font-sans">
        <span className="text-[#5C8A5C]">▪ {posW}% positive</span>
        <span className="text-warmgray">▪ {neuW}% neutral</span>
        <span className="text-[#B05252]">▪ {negW}% negative</span>
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

/* ── Upvote button ── */
function UpvoteButton({ reviewId, initialUpvotes }: { reviewId: string; initialUpvotes: number }) {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voted, setVoted] = useState(false);

  const handleUpvote = async () => {
    if (!user || voted) return;
    const res = await fetch("/api/reviews/upvote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId }) });
    if (res.ok) { const d = await res.json(); setUpvotes(d.upvotes); setVoted(true); }
    else if (res.status === 409) setVoted(true);
  };

  return (
    <button onClick={handleUpvote} disabled={!user || voted}
      className={`flex items-center gap-1 text-xs px-2 py-1 border transition-colors font-sans ${voted ? "border-terracotta/40 text-terracotta" : user ? "border-ink/15 text-warmgray hover:border-terracotta hover:text-terracotta" : "border-ink/10 text-ink/25 cursor-not-allowed"}`}
      title={!user ? "Sign in to upvote" : voted ? "Voted" : "Upvote"}
    >
      <svg className="w-3 h-3" fill={voted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
      {upvotes > 0 && <span>{upvotes}</span>}
    </button>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "scraped" | "community">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const { addCompany, removeCompany, isSelected } = useCompare();
  const inCompare = company ? isSelected(company.slug) : false;

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/company/${slug}`);
      if (res.status === 404) { setError("Company not found"); return; }
      if (!res.ok) throw new Error();
      setCompany(await res.json());
    } catch { setError("Failed to load company data"); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const unifiedReviews: UnifiedReview[] = [];
  if (company) {
    for (const r of company.reviews) unifiedReviews.push({ ...r, source: "scraped" });
    for (const r of company.userReviews) unifiedReviews.push({
      id: r.id, title: r.title, role: r.role, location: r.location, rating: r.overallRating,
      pros: r.pros, cons: r.cons, sentiment: null, sentimentScore: null,
      isCurrentEmployee: r.isCurrentEmployee, reviewDate: r.createdAt, source: "community",
      upvotes: r.upvotes, authorName: r.isAnonymous ? null : r.user.displayName,
    });
  }

  // Roles available given the current location filter
  const availableRoles = Array.from(new Set(
    unifiedReviews
      .filter((r) => locationFilter === "all" || r.location === locationFilter)
      .map((r) => r.role)
      .filter(Boolean) as string[]
  )).sort();

  // Locations available given the current role filter
  const availableLocations = Array.from(new Set(
    unifiedReviews
      .filter((r) => roleFilter === "all" || r.role === roleFilter)
      .map((r) => r.location)
      .filter(Boolean) as string[]
  )).sort();

  const filteredReviews = unifiedReviews.filter((r) => {
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (reviewFilter !== "all" && r.sentiment !== reviewFilter) return false;
    if (roleFilter !== "all" && r.role !== roleFilter) return false;
    if (locationFilter !== "all" && r.location !== locationFilter) return false;
    return true;
  });
  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);
  const communityCount = company?.userReviews.length ?? 0;
  const totalReviews = (company?.reviews.length ?? 0) + communityCount;
  const totalSalaries = (company?.salaries.length ?? 0) + (company?.userSalaries?.length ?? 0);

  return (
    <DashboardShell role="job-seeker">
      {/* Loading */}
      {loading && (
        <div className="bg-cream min-h-screen p-6 space-y-4">
          <Skeleton className="h-10 w-64 bg-ink/10" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-64 bg-ink/10" />
            <Skeleton className="h-64 col-span-2 bg-ink/10" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-cream min-h-screen p-6 text-center py-20">
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">{error}</h2>
          <p className="text-warmgray text-sm mb-6 font-sans">Try searching for a different company.</p>
          <SearchBar basePath="/job-seeker" />
        </div>
      )}

      {company && (
        <div className="bg-cream min-h-screen">

          {/* ── Header strip ── */}
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
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => inCompare ? removeCompany(company.slug) : addCompany({ slug: company.slug, name: company.name })}
                  className={`text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 border font-sans transition-colors ${inCompare ? "bg-terracotta border-terracotta text-white" : "border-terracotta text-terracotta hover:bg-terracotta hover:text-white"}`}
                >
                  {inCompare ? "✓ In Compare" : "+ Compare"}
                </motion.button>
              </div>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="flex flex-wrap items-center gap-3 text-xs text-warmgray font-sans"
              >
                {company.headquarters && <span>{company.headquarters}</span>}
                {company.employeeCount && <span>· {company.employeeCount}</span>}
                {company.founded && <span>· Est. {company.founded}</span>}
                {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">Website ↗</a>}
              </motion.div>
            </div>
            {company.lastScrapedAt && (
              <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray/50 font-sans self-start">
                Updated {new Date(company.lastScrapedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </motion.div>

          {/* ── Two-column workspace ── */}
          <div className="flex flex-col lg:flex-row min-h-0">

            {/* LEFT — 35%, sticky */}
            <div className="lg:w-[35%] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-ink/15 lg:sticky lg:top-11 lg:h-[calc(100vh-44px-73px)] lg:overflow-y-auto p-4 space-y-4">

              {/* ── Rating card — dramatic serif number ── */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
                className="bg-white border border-ink/20 overflow-hidden"
              >
                <ECardHeader label="Overall Rating" />
                <div className="p-4">
                  {company.overallRating != null ? (
                    <>
                      {/* Big serif number */}
                      <div className="text-center py-3 border-b border-ink/8 mb-4">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
                          className="font-serif font-bold text-terracotta block"
                          style={{ fontSize: "4.5rem", lineHeight: 1 }}
                        >
                          {company.overallRating.toFixed(1)}
                        </motion.span>
                        <span className="text-warmgray text-sm font-sans">out of 5.0</span>
                      </div>
                      <RatingGauge rating={company.overallRating} size="sm" />
                    </>
                  ) : (
                    <p className="text-warmgray text-sm py-6 text-center font-sans">No rating data</p>
                  )}

                  {/* Animated sub-rating bars */}
                  <div className="mt-4 pt-4 border-t border-ink/8 space-y-3">
                    {[
                      { label: "Work-Life Balance", value: company.workLifeBalance, delay: 0 },
                      { label: "Salary & Benefits", value: company.salaryBenefits, delay: 100 },
                      { label: "Job Security", value: company.jobSecurity, delay: 200 },
                      { label: "Career Growth", value: company.careerGrowth, delay: 300 },
                      { label: "Company Culture", value: company.companyCulture, delay: 400 },
                    ].map((item) => (
                      <RatingBar key={item.label} label={item.label} value={item.value} delay={item.delay} />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Radar card ── */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32, duration: 0.55, ease: "easeOut" }}
                className="bg-white border border-ink/20 overflow-hidden"
              >
                <ECardHeader label="Rating Breakdown" />
                <div className="p-2">
                  <BenefitsRadar
                    workLifeBalance={company.workLifeBalance}
                    salaryBenefits={company.salaryBenefits}
                    jobSecurity={company.jobSecurity}
                    careerGrowth={company.careerGrowth}
                    companyCulture={company.companyCulture}
                  />
                </div>
              </motion.div>

              {/* ── Stats card — counting numbers ── */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.44, duration: 0.55, ease: "easeOut" }}
                className="bg-white border border-ink/20 overflow-hidden"
              >
                <ECardHeader label="Data Summary" />
                <div className="grid grid-cols-3 divide-x divide-ink/10">
                  {[
                    { val: totalReviews, lbl: "Reviews" },
                    { val: totalSalaries, lbl: "Salaries" },
                    { val: company.benefits.length, lbl: "Benefits" },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} className="flex flex-col items-center py-4">
                      <span className="font-serif font-bold text-terracotta text-2xl leading-none">
                        <Counter target={val} />
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1.5 font-sans">{lbl}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── Sentiment card (if data exists) ── */}
              {company.sentiment && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.52, duration: 0.55, ease: "easeOut" }}
                  className="bg-white border border-ink/20 overflow-hidden"
                >
                  <ECardHeader label="Sentiment Overview" />
                  <div className="p-4">
                    <SentimentBar
                      positive={company.sentiment.positiveCount}
                      negative={company.sentiment.negativeCount}
                      neutral={company.sentiment.neutralCount}
                    />
                    {company.sentiment.topPositiveThemes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-ink/8">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#5C8A5C] font-sans mb-2">People like</p>
                        <div className="flex flex-wrap gap-1.5">
                          {company.sentiment.topPositiveThemes.slice(0, 4).map((t) => (
                            <span key={t} className="text-[10px] border border-[#5C8A5C]/30 text-[#5C8A5C] px-2 py-0.5 font-sans">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.sentiment.topNegativeThemes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#B05252] font-sans mb-2">Pain points</p>
                        <div className="flex flex-wrap gap-1.5">
                          {company.sentiment.topNegativeThemes.slice(0, 4).map((t) => (
                            <span key={t} className="text-[10px] border border-[#B05252]/30 text-[#B05252] px-2 py-0.5 font-sans">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* RIGHT — 65% */}
            <div className="flex-1 p-4 space-y-4 pb-24 lg:pb-6 overflow-y-auto">

              {/* ── Salary card ── */}
              <ECard delay={0.05}>
                <ECardHeader label="Salary Ranges by Role" />
                <ECardBody><SalaryChart salaries={company.salaries} /></ECardBody>
              </ECard>

              {/* ── Benefits card ── */}
              <ECard delay={0}>
                <ECardHeader label="Benefits & Perks" />
                <ECardBody><BenefitsBadges benefits={company.benefits} /></ECardBody>
              </ECard>

              {/* ── Reviews card ── */}
              <ECard delay={0}>
                <ECardHeader label={`Employee Reviews (${filteredReviews.length})`}>
                  <div className="flex flex-wrap items-center gap-1">
                    {/* Role dropdown — options scoped to current location */}
                    {availableRoles.length > 0 && (
                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          setRoleFilter(e.target.value);
                          setLocationFilter("all");
                          setShowAllReviews(false);
                        }}
                        className="text-[10px] uppercase tracking-[0.08em] border border-ink/20 text-warmgray bg-cream px-2 py-0.5 font-sans focus:outline-none focus:border-terracotta hover:border-terracotta transition-colors cursor-pointer"
                      >
                        <option value="all">All Roles</option>
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    )}
                    {/* Location dropdown — options scoped to current role */}
                    {availableLocations.length > 0 && (
                      <select
                        value={locationFilter}
                        onChange={(e) => {
                          setLocationFilter(e.target.value);
                          setRoleFilter("all");
                          setShowAllReviews(false);
                        }}
                        className="text-[10px] uppercase tracking-[0.08em] border border-ink/20 text-warmgray bg-cream px-2 py-0.5 font-sans focus:outline-none focus:border-terracotta hover:border-terracotta transition-colors cursor-pointer"
                      >
                        <option value="all">All Locations</option>
                        {availableLocations.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    )}
                    {(availableRoles.length > 0 || availableLocations.length > 0) && (
                      <span className="text-ink/20 text-xs">|</span>
                    )}
                    {communityCount > 0 && (
                      <>
                        {(["all", "scraped", "community"] as const).map((f) => (
                          <FilterPill key={f} active={sourceFilter === f} onClick={() => { setSourceFilter(f); setShowAllReviews(false); }}>
                            {f === "all" ? "All" : f === "scraped" ? "Data" : "Community"}
                          </FilterPill>
                        ))}
                        <span className="text-ink/20 text-xs">|</span>
                      </>
                    )}
                    {(["all", "positive", "negative", "neutral"] as const).map((f) => (
                      <FilterPill key={f} active={reviewFilter === f} onClick={() => { setReviewFilter(f); setShowAllReviews(false); }}>
                        {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                        {f !== "all" && company.sentiment && (
                          <span className="ml-1 opacity-50">
                            {f === "positive" && company.sentiment.positiveCount}
                            {f === "negative" && company.sentiment.negativeCount}
                            {f === "neutral" && company.sentiment.neutralCount}
                          </span>
                        )}
                      </FilterPill>
                    ))}
                  </div>
                </ECardHeader>
                <ECardBody className="space-y-3">
                  {displayedReviews.length === 0 ? (
                    <p className="text-sm text-warmgray text-center py-4 font-sans">No reviews matching this filter</p>
                  ) : (
                    <>
                      {displayedReviews.map((review, i) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
                        >
                          {review.source === "community" && (
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-[0.1em] border border-purple-400/40 text-purple-500 px-1.5 py-0.5 font-sans">Community</span>
                                {review.authorName && <span className="text-xs text-warmgray font-sans">by {review.authorName}</span>}
                              </div>
                              <UpvoteButton reviewId={review.id} initialUpvotes={review.upvotes ?? 0} />
                            </div>
                          )}
                          <ReviewCard review={review} />
                        </motion.div>
                      ))}
                      {!showAllReviews && filteredReviews.length > 10 && (
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
                </ECardBody>
              </ECard>

              {/* ── Contribute card ── */}
              <ECard delay={0}>
                <ECardHeader label="Contribute" />
                <ECardBody>
                  <p className="text-xs text-warmgray mb-4 font-sans leading-relaxed">
                    Share your experience — your data helps others make informed decisions.
                    All submissions are anonymous by default.
                  </p>
                  <div className="flex gap-3 mb-4">
                    {[
                      { label: "Write a Review", form: "review" as const },
                      { label: "Share Salary", form: "salary" as const },
                    ].map(({ label, form }) => {
                      const active = form === "review" ? showReviewForm : showSalaryForm;
                      return (
                        <motion.button
                          key={form}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (form === "review") { setShowReviewForm(!showReviewForm); setShowSalaryForm(false); }
                            else { setShowSalaryForm(!showSalaryForm); setShowReviewForm(false); }
                          }}
                          className={`text-xs uppercase tracking-[0.1em] px-4 py-2 border font-sans transition-colors ${active ? "bg-terracotta border-terracotta text-white" : "border-ink/30 text-ink hover:border-terracotta hover:text-terracotta"}`}
                        >
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                  {showReviewForm && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                      <ReviewForm slug={company.slug} companyName={company.name} onSuccess={() => { setShowReviewForm(false); fetchCompany(); }} onCancel={() => setShowReviewForm(false)} />
                    </motion.div>
                  )}
                  {showSalaryForm && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                      <SalaryForm slug={company.slug} companyName={company.name} onSuccess={() => { setShowSalaryForm(false); fetchCompany(); }} onCancel={() => setShowSalaryForm(false)} />
                    </motion.div>
                  )}
                </ECardBody>
              </ECard>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
