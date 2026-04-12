"use client";

import { useState, useEffect } from "react";

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL ?? "";

interface CompanyRow {
  name: string;
  slug: string;
  industry: string;
  status: string | null;
  last_scraped: string | null;
  reviews: number | null;
  salaries: number | null;
  benefits: number | null;
}

interface HealthFlag {
  slug: string;
  name: string;
  issues: string[];
}

function analyseHealth(companies: CompanyRow[]): HealthFlag[] {
  const flags: HealthFlag[] = [];
  const now = Date.now();
  const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  for (const c of companies) {
    const issues: string[] = [];

    if (!c.status) {
      issues.push("Never scraped");
    } else if (c.status === "failed") {
      issues.push("Last scrape failed");
    }

    if (c.last_scraped) {
      const age = now - new Date(c.last_scraped).getTime();
      if (age > STALE_MS) {
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        issues.push(`Stale — last scraped ${days}d ago`);
      }
    }

    if (c.status === "success") {
      // Reviews and salaries are core data — flag if missing
      if (!c.reviews || c.reviews === 0) issues.push("0 reviews");
      if (!c.salaries || c.salaries === 0) issues.push("0 salaries");
      // Benefits are optional on AmbitionBox — only flag if reviews exist but benefits don't
      // (suggests the page was scraped but benefits section wasn't found, which is normal)
    }

    if (issues.length > 0) flags.push({ slug: c.slug, name: c.name, issues });
  }

  return flags;
}

export default function HealthPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraperError, setScraperError] = useState(false);

  useEffect(() => {
    fetch(`${SCRAPER_URL}/registry`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data);
        setLoading(false);
      })
      .catch(() => {
        setScraperError(true);
        setLoading(false);
      });
  }, []);

  const flags = analyseHealth(companies);
  const healthy = companies.length - flags.length;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-serif font-bold text-cream">Data Health</h1>
        <p className="text-sm text-white/40 mt-1">
          Flags companies with missing data, stale scrapes, or scrape failures.
        </p>
      </div>

      {scraperError && (
        <div className="mb-6 px-4 py-3 rounded-sm border border-[#B05252]/20 bg-[#B05252]/8 text-xs text-[#B05252] font-sans">
          Cannot reach scraper at {SCRAPER_URL || "http://localhost:8000"}. Start it to load health data.
        </div>
      )}

      {/* Summary */}
      {!loading && !scraperError && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="px-4 py-3 rounded-sm border border-white/8 bg-white/2 text-center">
            <div className="text-2xl font-bold font-serif text-cream">{companies.length}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5 font-sans">Total</div>
          </div>
          <div className="px-4 py-3 rounded-sm border border-white/8 bg-white/2 text-center">
            <div className="text-2xl font-bold font-serif text-[#4A7C59]">{healthy}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5 font-sans">Healthy</div>
          </div>
          <div className="px-4 py-3 rounded-sm border border-white/8 bg-white/2 text-center">
            <div className="text-2xl font-bold font-serif text-[#C9876E]">{flags.length}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5 font-sans">Flagged</div>
          </div>
        </div>
      )}

      {/* Flags list */}
      {loading && (
        <div className="py-16 text-center text-sm text-white/25 font-sans">Loading…</div>
      )}

      {!loading && !scraperError && flags.length === 0 && (
        <div className="py-16 text-center rounded-sm border border-white/8 bg-white/2">
          <p className="text-sm text-[#4A7C59] font-sans">All companies are healthy.</p>
        </div>
      )}

      {!loading && flags.length > 0 && (
        <div className="rounded-sm border border-white/8 bg-white/2 overflow-hidden">
          <div className="px-5 py-2 border-b border-white/8">
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-sans">
              Issues ({flags.length})
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {flags.map((flag) => (
              <div key={flag.slug} className="px-5 py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cream font-sans">{flag.name}</p>
                  <p className="text-[11px] text-white/25 font-mono">{flag.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {flag.issues.map((issue) => (
                    <span
                      key={issue}
                      className="text-[11px] px-2 py-0.5 rounded-sm border font-sans bg-[#C9876E]/10 text-[#C9876E] border-[#C9876E]/20"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
