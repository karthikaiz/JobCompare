"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { RatingGauge } from "@/components/charts/rating-gauge";
import { BenefitsRadar } from "@/components/charts/benefits-radar";
import { SalaryChart } from "@/components/charts/salary-chart";
import { BenefitsBadges } from "@/components/charts/benefits-badges";
import { ReviewCard } from "@/components/charts/review-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/context/compare-context";

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
  reviews: Array<{
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
  }>;
  salaries: Array<{
    role: string;
    minSalary: number;
    maxSalary: number;
    avgSalary: number | null;
    currency: string;
    experience: string | null;
    sampleCount: number | null;
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

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { addCompany, removeCompany, isSelected } = useCompare();
  const inCompare = company ? isSelected(company.slug) : false;

  useEffect(() => {
    async function fetchCompany() {
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
    }
    fetchCompany();
  }, [slug]);

  const filteredReviews = company?.reviews.filter((r) => {
    if (reviewFilter === "all") return true;
    return r.sentiment === reviewFilter;
  }) ?? [];

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);

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
            {/* Overall Rating */}
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

            {/* Radar Chart */}
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
                <div className="text-2xl font-bold text-blue-600">
                  {company.reviews.length}
                </div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {company.salaries.length}
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
                  Employee Reviews ({filteredReviews.length})
                </CardTitle>
                <div className="flex flex-wrap gap-1">
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
                    <ReviewCard key={review.id} review={review} />
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
