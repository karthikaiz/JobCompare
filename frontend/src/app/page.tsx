"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURED_COMPANIES = [
  { name: "Infosys", slug: "infosys", industry: "IT Services" },
  { name: "TCS", slug: "tcs", industry: "IT Services" },
  { name: "Flipkart", slug: "flipkart", industry: "E-Commerce" },
  { name: "Razorpay", slug: "razorpay", industry: "Fintech" },
  { name: "Zomato", slug: "zomato", industry: "Food & Delivery" },
  { name: "HDFC Bank", slug: "hdfc-bank", industry: "Banking" },
];

const STATS = [
  { value: "50+", label: "Companies" },
  { value: "13", label: "Industries" },
  { value: "5000+", label: "Reviews" },
  { value: "Daily", label: "Data Refresh" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/job-seeker?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Job<span className="text-blue-600">Compare</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/job-seeker">
              <Button variant="ghost" size="sm">Job Seeker</Button>
            </Link>
            <Link href="/recruiter">
              <Button variant="ghost" size="sm">Recruiter</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="text-center space-y-6 max-w-3xl">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-2">
            India&apos;s #1 Company Comparison Platform
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Compare companies
            <br />
            <span className="text-blue-600">before you decide</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Ratings, salaries, benefits, and employee reviews across 50+ Indian companies.
            Make smarter career decisions with data, not guesswork.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto pt-4">
            <Input
              placeholder="Search a company (e.g. Infosys, Flipkart, TCS...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 text-base"
            />
            <Button type="submit" size="lg" className="h-12 px-6">
              Search
            </Button>
          </form>

          {/* Role CTAs */}
          <div className="flex flex-wrap gap-4 justify-center pt-6">
            <Link href="/job-seeker">
              <Button size="lg" className="text-base px-8 py-5 bg-blue-600 hover:bg-blue-700">
                I&apos;m a Job Seeker
              </Button>
            </Link>
            <Link href="/recruiter">
              <Button size="lg" variant="outline" className="text-base px-8 py-5">
                I&apos;m a Recruiter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Companies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURED_COMPANIES.map((company) => (
              <Link
                key={company.slug}
                href={`/job-seeker/${company.slug}`}
                className="flex items-center gap-3 p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {company.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-sm">{company.name}</div>
                  <div className="text-xs text-muted-foreground">{company.industry}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>JobCompare - Compare companies across ratings, salaries, benefits, and reviews.</p>
      </footer>
    </div>
  );
}
