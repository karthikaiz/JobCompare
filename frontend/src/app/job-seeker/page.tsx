"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const TOP_COMPANIES = [
  { name: "Infosys", slug: "infosys", rating: 3.5, industry: "IT Services" },
  { name: "Flipkart", slug: "flipkart", rating: 3.9, industry: "E-Commerce" },
  { name: "Razorpay", slug: "razorpay", rating: 3.4, industry: "Fintech" },
  { name: "TCS", slug: "tcs", rating: 3.7, industry: "IT Services" },
  { name: "Zomato", slug: "zomato", rating: 3.9, industry: "Food & Delivery" },
  { name: "HDFC Bank", slug: "hdfc-bank", rating: 3.6, industry: "Banking" },
  { name: "Zoho", slug: "zoho", rating: 4.0, industry: "SaaS" },
  { name: "Swiggy", slug: "swiggy", rating: 3.8, industry: "Food & Delivery" },
];

function JobSeekerContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  return (
    <DashboardShell role="job-seeker">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header + Search */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Job Seeker Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Search a company to see ratings, salaries, benefits, and employee reviews.
          </p>
          <SearchBar
            basePath="/job-seeker"
            placeholder="Search companies (e.g. Infosys, Flipkart, TCS...)"
            initialQuery={initialQuery}
          />
        </div>

        {/* Quick Browse */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Browse Companies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TOP_COMPANIES.map((company) => (
              <Link key={company.slug} href={`/job-seeker/${company.slug}`}>
                <Card className="hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {company.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{company.name}</div>
                        <div className="text-xs text-muted-foreground">{company.industry}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <span className="text-yellow-500 text-sm">&#9733;</span>
                      <span className="text-sm font-medium">{company.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">/5.0</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* What you can explore */}
        <div>
          <h2 className="text-lg font-semibold mb-3">What You Can Explore</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Ratings & Reviews", desc: "Overall rating, work-life balance, salary, growth, culture scores with employee reviews" },
              { title: "Salary Ranges", desc: "Min/avg/max salary data by role with experience levels" },
              { title: "Benefits & Perks", desc: "Insurance, leaves, food, transport, and more — categorized" },
              { title: "Company Comparison", desc: "Compare 2-3 companies side by side across all metrics" },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function JobSeekerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50/30" />}>
      <JobSeekerContent />
    </Suspense>
  );
}
