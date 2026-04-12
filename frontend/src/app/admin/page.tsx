"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL ?? "";

interface RegistryStats {
  total: number;
  scraped: number;
  failed: number;
  pending: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [scraperOnline, setScraperOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Check scraper health
    fetch(`${SCRAPER_URL}/health`)
      .then((r) => setScraperOnline(r.ok))
      .catch(() => setScraperOnline(false));

    // Fetch registry for stats
    fetch(`${SCRAPER_URL}/registry`)
      .then((r) => r.json())
      .then((data: Array<{ status: string | null }>) => {
        setStats({
          total: data.length,
          scraped: data.filter((c) => c.status === "success").length,
          failed: data.filter((c) => c.status === "failed").length,
          pending: data.filter((c) => !c.status).length,
        });
      })
      .catch(() => setStats(null));
  }, []);

  const tiles = [
    {
      href: "/admin/companies",
      label: "Companies",
      description: "Manage the company registry — add, remove, inspect scrape status.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      href: "/admin/scraper",
      label: "Scraper",
      description: "Run scrape cycles, inspect per-company job output, tail logs.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      href: "/admin/industry-standards",
      label: "Industry Standards",
      description: "Review and override benchmark ratings per industry.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: "/admin/health",
      label: "Data Health",
      description: "Spot missing fields, stale scrapes, and data quality issues.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-serif font-bold text-cream">Admin Overview</h1>
        <p className="text-sm text-white/40 mt-1">Control centre — localhost only</p>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-sm border border-white/8 bg-white/3">
        <span className="text-xs text-white/40 uppercase tracking-widest font-sans">Scraper</span>
        {scraperOnline === null && (
          <span className="text-xs text-white/30">Checking…</span>
        )}
        {scraperOnline === true && (
          <span className="flex items-center gap-1.5 text-xs text-[#4A7C59]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] inline-block" />
            Online
          </span>
        )}
        {scraperOnline === false && (
          <span className="flex items-center gap-1.5 text-xs text-[#B05252]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B05252] inline-block" />
            Offline — run <code className="font-mono ml-1">uvicorn main:app</code>
          </span>
        )}

        {stats && (
          <div className="ml-auto flex items-center gap-5">
            <span className="text-xs text-white/50">{stats.total} companies</span>
            <span className="text-xs text-[#4A7C59]">{stats.scraped} scraped</span>
            {stats.failed > 0 && (
              <span className="text-xs text-[#B05252]">{stats.failed} failed</span>
            )}
            {stats.pending > 0 && (
              <span className="text-xs text-white/30">{stats.pending} pending</span>
            )}
          </div>
        )}
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group flex flex-col gap-3 p-5 rounded-sm border border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-white/30 group-hover:text-terracotta transition-colors">
                {tile.icon}
              </span>
              <span className="text-sm font-medium text-white/70 group-hover:text-cream transition-colors">
                {tile.label}
              </span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
