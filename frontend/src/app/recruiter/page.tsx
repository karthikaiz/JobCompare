"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const TOP_COMPANIES = [
  { name: "Infosys", slug: "infosys", rating: 3.5, industry: "IT Services" },
  { name: "TCS", slug: "tcs", rating: 3.7, industry: "IT Services" },
  { name: "Flipkart", slug: "flipkart", rating: 3.9, industry: "E-Commerce" },
  { name: "Razorpay", slug: "razorpay", rating: 3.4, industry: "Fintech" },
  { name: "Zomato", slug: "zomato", rating: 3.9, industry: "Food & Delivery" },
  { name: "HDFC Bank", slug: "hdfc-bank", rating: 3.6, industry: "Banking" },
];

export default function RecruiterPage() {
  return (
    <DashboardShell role="recruiter">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header + Search */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Recruiter Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Analyze company sentiment, explore why employees leave, and get competitive intel.
          </p>
          <SearchBar
            basePath="/recruiter"
            placeholder="Search companies to analyze..."
          />
        </div>

        {/* Quick Browse */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Analyze a Company</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOP_COMPANIES.map((company) => (
              <Link key={company.slug} href={`/recruiter/${company.slug}`}>
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
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recruiter insights */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recruiter Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Sentiment Analysis", desc: "Positive/negative/neutral breakdown of employee reviews" },
              { title: "Why People Leave", desc: "Top negative themes from employee reviews" },
              { title: "Competitive Intel", desc: "Compare your company against competitors" },
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
