"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";
import { OnboardingTour } from "@/components/onboarding-tour";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuth } from "@/context/auth-context";

const EXPLORE_ITEMS = [
  { label: "Ratings & Reviews", desc: "Overall score + sub-ratings from employees" },
  { label: "Salary Ranges", desc: "Min / avg / max by role and experience" },
  { label: "Benefits & Perks", desc: "Insurance, leaves, food, transport, and more" },
  { label: "Side-by-Side Compare", desc: "Compare 2–3 companies across all metrics" },
];

interface Company {
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
}

function JobSeekerContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [companies, setCompanies] = useState<Company[]>([]);
  const { user } = useAuth();
  const { items: watchlistItems, toggle: toggleWatchlist } = useWatchlist();

  useEffect(() => {
    fetch("/api/companies?limit=8&offset=0")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .catch(() => {});
  }, []);

  const featured = companies[0];
  const tiles = companies.slice(1);

  return (
    <DashboardShell role="job-seeker">
      <OnboardingTour />
      <div className="bg-cream min-h-screen p-4 sm:p-6 pb-20 sm:pb-6 space-y-5">
        {/* Search row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-terracotta" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">Search Companies</span>
          </div>
          <SearchBar
            basePath="/job-seeker"
            placeholder="Search companies (e.g. Infosys, Flipkart, Accenture...)"
            initialQuery={initialQuery}
          />
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Featured spotlight */}
          <motion.div
            className="sm:col-span-1 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          >
            {featured ? (
              <Link href={`/job-seeker/${featured.slug}`} className="block h-full group">
                <div className="bg-card border-2 border-ink/15 h-full overflow-hidden flex flex-col hover:border-terracotta/40 transition-colors">
                  <div className="px-4 py-2.5 border-b border-ink/10 bg-cream flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Spotlight</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="w-10 h-10 bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta font-bold text-lg mb-3 font-serif">
                        {featured.name.charAt(0)}
                      </div>
                      <div className="font-serif font-bold text-ink text-lg leading-tight">{featured.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mt-0.5">{featured.industry}</div>
                    </div>
                    <div className="mt-5">
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold font-mono text-terracotta">{featured.overallRating?.toFixed(1) ?? "—"}</span>
                        <span className="text-warmgray text-sm mb-1 font-sans">/5.0</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans mt-0.5">Overall Rating</div>
                      <div className="mt-4 text-xs text-terracotta font-sans group-hover:underline">View details →</div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-card border-2 border-ink/10 h-full min-h-[200px] animate-pulse" />
            )}
          </motion.div>

          {/* Tiles grid */}
          <motion.div
            className="sm:col-span-3 min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          >
            <div className="bg-card border border-ink/15 h-full overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
                <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Browse Companies</span>
              </div>
              <div className="p-3 flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 h-full">
                  {tiles.length > 0 ? tiles.map((company, i) => (
                    <motion.div
                      key={company.slug}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.06, duration: 0.35, ease: "easeOut" }}
                    >
                      <Link href={`/job-seeker/${company.slug}`} className="block">
                        <div className="border border-ink/15 p-3 hover:border-terracotta/40 hover:bg-terracotta/3 transition-all cursor-pointer group">
                          <div className="w-6 h-6 bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-xs mb-2 font-serif group-hover:bg-terracotta/15 transition-colors">
                            {company.name.charAt(0)}
                          </div>
                          <div className="text-ink text-xs font-medium font-sans truncate">{company.name}</div>
                          <div className="text-warmgray text-[10px] font-sans truncate mt-0.5">{company.industry}</div>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-terracotta text-xs">★</span>
                            <span className="text-ink text-xs font-mono">{company.overallRating?.toFixed(1) ?? "—"}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )) : Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="border border-ink/10 p-3 h-24 animate-pulse bg-ink/3" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions / explore strip */}
          <motion.div
            className="sm:col-span-4 min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            <div className="bg-card border border-ink/15 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
                <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">What You Can Explore</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-ink/8">
                {EXPLORE_ITEMS.map((item) => (
                  <div key={item.label} className="px-4 py-3">
                    <div className="text-ink text-sm font-medium font-sans mb-1">{item.label}</div>
                    <div className="text-warmgray text-xs font-sans leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Watchlist — only when logged in and has items */}
          {user && watchlistItems.length > 0 && (
            <motion.div
              className="sm:col-span-4 min-w-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
            >
              <div className="bg-card border border-ink/15 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-ink/10 bg-cream flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">
                    Your Watchlist ({watchlistItems.length}/20)
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-terracotta/40">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {watchlistItems.map((item, i) => (
                      <motion.div
                        key={item.slug}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.05, duration: 0.3, ease: "easeOut" }}
                      >
                        <div className="border border-ink/15 p-3 group relative hover:border-terracotta/40 transition-colors">
                          <Link href={`/job-seeker/${item.slug}`} className="block">
                            <div className="w-6 h-6 bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-xs mb-2 font-serif group-hover:bg-terracotta/15 transition-colors">
                              {item.name.charAt(0)}
                            </div>
                            <div className="text-ink text-xs font-medium font-sans truncate">{item.name}</div>
                            <div className="text-warmgray text-[10px] font-sans truncate mt-0.5">{item.industry}</div>
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-terracotta text-xs">★</span>
                              <span className="text-ink text-xs font-mono">{item.overallRating?.toFixed(1) ?? "—"}</span>
                            </div>
                          </Link>
                          <button
                            onClick={() => toggleWatchlist(item.slug)}
                            className="absolute top-2 right-2 text-warmgray/40 hover:text-terracotta transition-colors"
                            title="Remove from watchlist"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function JobSeekerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <JobSeekerContent />
    </Suspense>
  );
}
