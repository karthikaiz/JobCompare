"use client";

import Link from "next/link";
import { useCompare } from "@/context/compare-context";

export function CompareBar() {
  const { companies, removeCompany, clear } = useCompare();

  if (companies.length === 0) return null;

  return (
    <div className="fixed bottom-[48px] md:bottom-0 left-0 right-0 z-50 bg-cream border-t-2 border-ink/20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans">
            Compare ({companies.length}/3):
          </span>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <span
                key={c.slug}
                className="inline-flex items-center gap-1 bg-terracotta/10 text-terracotta border border-terracotta/30 text-xs px-2.5 py-1 font-sans"
              >
                {c.name}
                <button
                  onClick={() => removeCompany(c.slug)}
                  className="hover:text-ink ml-0.5 min-w-[20px] min-h-[20px] inline-flex items-center justify-center"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clear}
            className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans"
          >
            Clear
          </button>
          {companies.length >= 2 && (
            <Link
              href="/job-seeker/compare"
              className="text-xs uppercase tracking-[0.1em] bg-ink text-cream px-4 py-2 hover:bg-terracotta transition-colors font-sans"
            >
              Compare Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
