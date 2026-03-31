"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { RatingGauge } from "@/components/charts/rating-gauge";
import { BenefitsRadar } from "@/components/charts/benefits-radar";
import { SalaryChart } from "@/components/charts/salary-chart";
import { BenefitsBadges } from "@/components/charts/benefits-badges";
import { ReviewCard } from "@/components/charts/review-card";
import { ReviewForm } from "@/components/review-form";
import { SalaryForm } from "@/components/salary-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/context/compare-context";
import { useAuth } from "@/context/auth-context";

interface ScrapedReview {
  id: string;
  title: string | null;
  role: string | null;
  location: string | null;
  rating: number | null;
  pros: string;
  cons: string;
  sentiment: string | null;
  sentimentScore: number | null;
  isCurrentEmployee: boolean | null;
  reviewDate: string | null;
}

interface UserReview {
  id: string;
  title: string;
  role: string;
  location: string | null;
  overallRating: number;
  pros: string;
  cons: string;
  isAnonymous: boolean;
  isCurrentEmployee: boolean;
  upvotes: number;
  createdAt: string;
  user: { displayName: string | null };
}

interface CompanyData {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  headquarters: string | null;
  employeeCount: string | null;
  founded: number | null;
  website: string | null;
  overallRating: number | null;
  workLifeBalance: number | null;
  salaryBenefits: number | null;
  jobSecurity: number | null;
  careerGrowth: number | null;
  companyCulture: number | null;
  source: string;
  lastScrapedAt: string | null;
  reviews: ScrapedReview[];
  userReviews: UserReview[];
  salaries: Array<{
    role: string;
    minSalary: number;
    maxSalary: number;
    avgSalary: number | null;
    currency: string;
    experience: string | null;
    sampleCount: number | null;
  }>;
  userSalaries: Array<{
    id: string;
    role: string;
    location: string | null;
    baseSalary: number;
    totalComp: number | null;
    experience: string | null;
  }>;
  benefits: Array<{
    category: string;
    name: string;
    details: string | null;
  }>;
  sentiment: {
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    topPositiveThemes: string[];
    topNegativeThemes: string[];
  } | null;
}

// Unified review type for display
interface UnifiedReview {
  id: string;
  title: string | null;
  role: string | null;
  location: string | null;
  rating: number | null;
  pros: string;
  cons: string;
  sentiment: string | null;
  sentimentScore: number | null;
  isCurrentEmployee: boolean | null;
  reviewDate: string | null;
  source: "scraped" | "community";
  upvotes?: number;
  authorName?: string | null;
}

function CompanyDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48 md:col-span-2" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  );
}

function UpvoteButton({ reviewId, initialUpvotes }: { reviewId: string; initialUpvotes: number }) {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voted, setVoted] = useState(false);

  const handleUpvote = async () => {
    if (!user || voted) return;
    const res = await fetch("/api/reviews/upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    if (res.ok) {
      const data = await res.json();
      setUpvotes(data.upvotes);
      setVoted(true);
    } else if (res.status === 409) {
      // Already upvoted (e.g. from another tab)
      setVoted(true);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={!user || voted}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
        voted
          ? "bg-blue-100 text-blue-600"
          : user
          ? "hover:bg-gray-100 text-gray-500"
          : "text-gray-300 cursor-not-allowed"
      }`}
      title={!user ? "Sign in to upvote" : voted ? "You upvoted this" : "Upvote"}
      aria-label={`Upvote review${upvotes > 0 ? `, ${upvotes} upvotes` : ""}`}
    >
      <svg className="w-3.5 h-3.5" fill={voted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const { addCompany, removeCompany, isSelected } = useCompare();
  const inCompare = company ? isSelected(company.slug) : false;

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/company/${slug}`);
      if (res.status === 404) {
        setError("Company not found");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCompany(data);
    } catch {
      setError("Failed to load company data");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  // Merge scraped + community reviews into unified list
  const unifiedReviews: UnifiedReview[] = [];
  if (company) {
    for (const r of company.reviews) {
      unifiedReviews.push({ ...r, source: "scraped" });
    }
    for (const r of company.userReviews) {
      unifiedReviews.push({
        id: r.id,
        title: r.title,
        role: r.role,
        location: r.location,
        rating: r.overallRating,
        pros: r.pros,
        cons: r.cons,
        sentiment: null,
        sentimentScore: null,
        isCurrentEmployee: r.isCurrentEmployee,
        reviewDate: r.createdAt,
        source: "community",
        upvotes: r.upvotes,
        authorName: r.isAnonymous ? null : r.user.displayName,
      });
    }
  }

  const filteredReviews = unifiedReviews.filter((r) => {
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (reviewFilter === "all") return true;
    return r.sentiment === reviewFilter;
  });

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);
  const communityCount = company?.userReviews.length ?? 0;
  const scrapedCount = company?.reviews.length ?? 0;
  const totalReviews = communityCount + scrapedCount;

  return (
    <DashboardShell role="job-seeker">
      {loading && <CompanyDetailSkeleton />}

      {error && (
        <div className="max-w-5xl mx-auto text-center py-20">
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <p className="text-muted-foreground text-sm">
            Try searching for a different company.
          </p>
          <div className="mt-6 flex justify-center">
            <SearchBar basePath="/job-seeker" />
          </div>
        </div>
      )}

      {company && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Company Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold">{company.name}</h1>
                {company.industry && (
                  <Badge variant="outline">{company.industry}</Badge>
                )}
                <Button
                  variant={inCompare ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 px-3"
                  onClick={() =>
                    inCompare
                      ? removeCompany(company.slug)
                      : addCompany({ slug: company.slug, name: company.name })
                  }
                >
                  {inCompare ? "Remove from Compare" : "+ Compare"}
                </Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {company.headquarters && <span>{company.headquarters}</span>}
                {company.employeeCount && (
                  <span>&middot; {company.employeeCount} employees</span>
                )}
                {company.founded && <span>&middot; Est. {company.founded}</span>}
                {company.website && (
                  <>
                    <span>&middot;</span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </>
                )}
              </div>
              {company.lastScrapedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated{" "}
                  {new Date(company.lastScrapedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Rating + Radar Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overall Rating</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {company.overallRating != null ? (
                  <RatingGauge rating={company.overallRating} size="lg" />
                ) : (
                  <p className="text-sm text-muted-foreground py-8">No rating</p>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 text-xs w-full max-w-[200px]">
                  {[
                    { label: "Work-Life", value: company.workLifeBalance },
                    { label: "Salary", value: company.salaryBenefits },
                    { label: "Security", value: company.jobSecurity },
                    { label: "Growth", value: company.careerGrowth },
                    { label: "Culture", value: company.companyCulture },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value?.toFixed(1) ?? "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <BenefitsRadar
                  workLifeBalance={company.workLifeBalance}
                  salaryBenefits={company.salaryBenefits}
                  jobSecurity={company.jobSecurity}
                  careerGrowth={company.careerGrowth}
                  companyCulture={company.companyCulture}
                />
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalReviews}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
                {communityCount > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {communityCount} community
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {company.salaries.length + (company.userSalaries?.length ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">Salary Entries</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {company.benefits.length}
                </div>
                <div className="text-xs text-muted-foreground">Benefits</div>
              </CardContent>
            </Card>
          </div>

          {/* Contribute Section */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => { setShowReviewForm(!showReviewForm); setShowSalaryForm(false); }}
              variant={showReviewForm ? "default" : "outline"}
              className={showReviewForm ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Write a Review
            </Button>
            <Button
              onClick={() => { setShowSalaryForm(!showSalaryForm); setShowReviewForm(false); }}
              variant={showSalaryForm ? "default" : "outline"}
              className={showSalaryForm ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Share Salary
            </Button>
          </div>

          {showReviewForm && (
            <ReviewForm
              slug={company.slug}
              companyName={company.name}
              onSuccess={() => {
                setShowReviewForm(false);
                fetchCompany();
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          {showSalaryForm && (
            <SalaryForm
              slug={company.slug}
              companyName={company.name}
              onSuccess={() => {
                setShowSalaryForm(false);
                fetchCompany();
              }}
              onCancel={() => setShowSalaryForm(false)}
            />
          )}

          {/* Salary Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Salary Ranges by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <SalaryChart salaries={company.salaries} />
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Benefits & Perks</CardTitle>
            </CardHeader>
            <CardContent>
              <BenefitsBadges benefits={company.benefits} />
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm">
                  Reviews ({filteredReviews.length})
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {/* Source filter */}
                  {communityCount > 0 && (
                    <div className="flex gap-1 sm:border-r sm:pr-2 sm:mr-1">
                      {(["all", "scraped", "community"] as const).map((f) => (
                        <Button
                          key={f}
                          variant={sourceFilter === f ? "default" : "ghost"}
                          size="sm"
                          className="text-xs h-8 px-2.5"
                          onClick={() => {
                            setSourceFilter(f);
                            setShowAllReviews(false);
                          }}
                        >
                          {f === "all" ? "All Sources" : f === "scraped" ? "Data" : "Community"}
                        </Button>
                      ))}
                    </div>
                  )}
                  {/* Sentiment filter */}
                  {(["all", "positive", "negative", "neutral"] as const).map((f) => (
                    <Button
                      key={f}
                      variant={reviewFilter === f ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-8 px-2.5"
                      onClick={() => {
                        setReviewFilter(f);
                        setShowAllReviews(false);
                      }}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                      {f !== "all" && company.sentiment && (
                        <span className="ml-1 opacity-60">
                          {f === "positive" && company.sentiment.positiveCount}
                          {f === "negative" && company.sentiment.negativeCount}
                          {f === "neutral" && company.sentiment.neutralCount}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayedReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No {reviewFilter !== "all" ? reviewFilter : ""} reviews
                </p>
              ) : (
                <>
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="relative">
                      {review.source === "community" && (
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-700 text-xs border-0">
                              Community
                            </Badge>
                            {review.authorName && (
                              <span className="text-xs text-muted-foreground">
                                by {review.authorName}
                              </span>
                            )}
                          </div>
                          <UpvoteButton reviewId={review.id} initialUpvotes={review.upvotes ?? 0} />
                        </div>
                      )}
                      <ReviewCard review={review} />
                    </div>
                  ))}
                  {!showAllReviews && filteredReviews.length > 10 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllReviews(true)}
                      >
                        Show all {filteredReviews.length} reviews
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
