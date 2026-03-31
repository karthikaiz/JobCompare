"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { ThemeBarChart } from "@/components/charts/theme-bar-chart";
import { ReviewCard } from "@/components/charts/review-card";
import { RatingGauge } from "@/components/charts/rating-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
  }>;
  benefits: Array<{ category: string; name: string }>;
  sentiment: {
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    topPositiveThemes: string[];
    topNegativeThemes: string[];
  } | null;
}

interface CompetitorSummary {
  slug: string;
  name: string;
  overallRating: number | null;
  industry: string | null;
  _count: { reviews: number };
}

function RecruiterSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
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
  const [employeeFilter, setEmployeeFilter] = useState<"all" | "current" | "former">("all");
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/company/${slug}`);
        if (res.status === 404) {
          setError("Company not found");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCompany(data);

        // Fetch competitors (same industry) — non-critical, don't fail the page
        if (data.industry) {
          try {
            const compRes = await fetch(`/api/companies?industry=${encodeURIComponent(data.industry)}&limit=6`);
            if (compRes.ok) {
              const compData = await compRes.json();
              setCompetitors(
                (compData.companies || []).filter((c: CompetitorSummary) => c.slug !== slug)
              );
            }
          } catch {
            // Competitor panel is optional — silently skip
          }
        }
      } catch {
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Filters
  const roles = Array.from(new Set(company?.reviews.map((r) => r.role).filter(Boolean) as string[]));

  const filteredReviews = (company?.reviews ?? []).filter((r) => {
    if (sentimentFilter !== "all" && r.sentiment !== sentimentFilter) return false;
    if (roleFilter && r.role !== roleFilter) return false;
    if (employeeFilter === "current" && r.isCurrentEmployee !== true) return false;
    if (employeeFilter === "former" && r.isCurrentEmployee !== false) return false;
    return true;
  });

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 8);

  // Sentiment counts from reviews (fallback if no snapshot)
  const posCount = company?.sentiment?.positiveCount ?? company?.reviews.filter((r) => r.sentiment === "positive").length ?? 0;
  const negCount = company?.sentiment?.negativeCount ?? company?.reviews.filter((r) => r.sentiment === "negative").length ?? 0;
  const neuCount = company?.sentiment?.neutralCount ?? company?.reviews.filter((r) => r.sentiment === "neutral").length ?? 0;

  return (
    <DashboardShell role="recruiter">
      {loading && <RecruiterSkeleton />}

      {error && (
        <div className="max-w-5xl mx-auto text-center py-20">
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <p className="text-muted-foreground text-sm">Try searching for a different company.</p>
          <div className="mt-6 flex justify-center">
            <SearchBar basePath="/recruiter" />
          </div>
        </div>
      )}

      {company && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold">{company.name}</h1>
              {company.industry && <Badge variant="outline">{company.industry}</Badge>}
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Recruiter View
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-muted-foreground">
              {company.headquarters && <span>{company.headquarters}</span>}
              {company.employeeCount && <span>&middot; {company.employeeCount} employees</span>}
              {company.lastScrapedAt && (
                <span>
                  &middot; Updated{" "}
                  {new Date(company.lastScrapedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Top Row: Sentiment + Rating + Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sentiment Donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Employee Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <SentimentDonut positive={posCount} negative={negCount} neutral={neuCount} />
              </CardContent>
            </Card>

            {/* Overall Rating */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overall Rating</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {company.overallRating != null ? (
                  <RatingGauge rating={company.overallRating} size="md" />
                ) : (
                  <p className="text-sm text-muted-foreground py-8">No rating</p>
                )}
                <div className="grid grid-cols-1 gap-1 mt-4 text-xs w-full max-w-[180px]">
                  {[
                    { label: "Work-Life Balance", value: company.workLifeBalance },
                    { label: "Salary & Benefits", value: company.salaryBenefits },
                    { label: "Job Security", value: company.jobSecurity },
                    { label: "Career Growth", value: company.careerGrowth },
                    { label: "Company Culture", value: company.companyCulture },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value?.toFixed(1) ?? "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{posCount}</div>
                    <div className="text-xs text-green-700">Positive</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{negCount}</div>
                    <div className="text-xs text-red-700">Negative</div>
                  </div>
                </div>
                {(posCount + negCount) > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Satisfaction Ratio</div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${Math.round((posCount / (posCount + negCount)) * 100)}%` }}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${Math.round((negCount / (posCount + negCount)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-0.5 text-muted-foreground">
                      <span>{Math.round((posCount / (posCount + negCount)) * 100)}% satisfied</span>
                      <span>{Math.round((negCount / (posCount + negCount)) * 100)}% dissatisfied</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">{company.reviews.length}</div>
                    <div className="text-xs text-muted-foreground">Reviews</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{company.salaries.length}</div>
                    <div className="text-xs text-muted-foreground">Salaries</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{company.benefits.length}</div>
                    <div className="text-xs text-muted-foreground">Benefits</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Theme Analysis Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700">What People Like</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeBarChart
                  themes={company.sentiment?.topPositiveThemes ?? []}
                  reviews={company.reviews}
                  type="positive"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-700">Why People Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeBarChart
                  themes={company.sentiment?.topNegativeThemes ?? []}
                  reviews={company.reviews}
                  type="negative"
                />
              </CardContent>
            </Card>
          </div>

          {/* Competitor Panel */}
          {competitors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Industry Competitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {competitors.map((comp) => (
                    <Link
                      key={comp.slug}
                      href={`/recruiter/${comp.slug}`}
                      className="p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-center"
                    >
                      <div className="font-medium text-sm truncate">{comp.name}</div>
                      <div className="text-lg font-bold text-blue-600 mt-1">
                        {comp.overallRating?.toFixed(1) ?? "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {comp._count.reviews} reviews
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filterable Reviews */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3">
                <CardTitle className="text-sm">
                  Employee Reviews ({filteredReviews.length})
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {/* Sentiment Filter */}
                  <div className="flex gap-1">
                    {(["all", "positive", "negative", "neutral"] as const).map((f) => (
                      <Button
                        key={f}
                        variant={sentimentFilter === f ? "default" : "ghost"}
                        size="sm"
                        className="text-xs h-8 px-2.5"
                        onClick={() => { setSentimentFilter(f); setShowAllReviews(false); }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Employee Status Filter */}
                  <div className="flex gap-1 sm:border-l sm:pl-2">
                    {(["all", "current", "former"] as const).map((f) => (
                      <Button
                        key={f}
                        variant={employeeFilter === f ? "default" : "ghost"}
                        size="sm"
                        className="text-xs h-8 px-2.5"
                        onClick={() => { setEmployeeFilter(f); setShowAllReviews(false); }}
                      >
                        {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Role Filter */}
                  {roles.length > 1 && (
                    <select
                      value={roleFilter}
                      onChange={(e) => { setRoleFilter(e.target.value); setShowAllReviews(false); }}
                      className="text-xs h-8 px-2.5 border rounded-md bg-white"
                    >
                      <option value="">All Roles</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>{role.length > 40 ? role.slice(0, 38) + "..." : role}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayedReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No reviews match your filters
                </p>
              ) : (
                <>
                  {displayedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {!showAllReviews && filteredReviews.length > 8 && (
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
