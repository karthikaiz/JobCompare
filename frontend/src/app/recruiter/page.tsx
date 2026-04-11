"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SearchBar } from "@/components/search-bar";

const INSIGHTS = [
  { label: "Sentiment Analysis", desc: "Positive / negative / neutral breakdown" },
  { label: "Why People Leave", desc: "Top negative themes from reviews" },
  { label: "Competitive Intel", desc: "Compare against competitors in the same industry" },
];

interface Company {
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
}

export default function RecruiterPage() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetch("/api/companies?limit=6&offset=0")
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .catch(() => {});
  }, []);

  const featured = companies[0];
  const tiles = companies.slice(1);

  return (
    <DashboardShell role="recruiter">
      <div className="bg-cream min-h-screen p-4 sm:p-6 pb-6 space-y-5">
        {/* Search row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-terracotta" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">Analyze Companies</span>
          </div>
          <SearchBar basePath="/recruiter" placeholder="Search companies to analyze..." />
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
              <Link href={`/recruiter/${featured.slug}`} className="block h-full group">
                <div className="bg-white border-2 border-ink/15 h-full overflow-hidden flex flex-col hover:border-terracotta/40 transition-colors">
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
                      <div className="mt-4 text-xs text-terracotta font-sans group-hover:underline">Analyze →</div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-white border-2 border-ink/10 h-full min-h-[200px] animate-pulse" />
            )}
          </motion.div>

          {/* Tiles */}
          <motion.div
            className="sm:col-span-3 min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          >
            <div className="bg-white border border-ink/15 h-full overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
                <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Companies to Analyze</span>
              </div>
              <div className="p-3 flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tiles.length > 0 ? tiles.map((company, i) => (
                    <motion.div
                      key={company.slug}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.06, duration: 0.35, ease: "easeOut" }}
                    >
                      <Link href={`/recruiter/${company.slug}`} className="block">
                        <div className="border border-ink/15 p-3 hover:border-terracotta/40 hover:bg-terracotta/3 transition-all cursor-pointer group">
                          <div className="w-6 h-6 bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-xs mb-2 font-serif group-hover:bg-terracotta/15 transition-colors">
                            {company.name.charAt(0)}
                          </div>
                          <div className="text-ink text-xs font-medium font-sans truncate">{company.name}</div>
                          <div className="text-warmgray text-[10px] font-sans truncate mt-0.5">{company.industry}</div>
                          <div className="mt-2 text-xs text-terracotta font-sans group-hover:underline">Analyze →</div>
                        </div>
                      </Link>
                    </motion.div>
                  )) : Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border border-ink/10 p-3 h-20 animate-pulse bg-ink/3" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Insights strip */}
          <motion.div
            className="sm:col-span-4 min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            <div className="bg-white border border-ink/15 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-ink/10 bg-cream">
                <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Recruiter Insights</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink/8">
                {INSIGHTS.map((item) => (
                  <div key={item.label} className="px-4 py-3">
                    <div className="text-ink text-sm font-medium font-sans mb-1">{item.label}</div>
                    <div className="text-warmgray text-xs font-sans leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}
