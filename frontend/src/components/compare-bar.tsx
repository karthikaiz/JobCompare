"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare } from "@/context/compare-context";

export function CompareBar() {
  const { companies, removeCompany, clear } = useCompare();
  const pathname = usePathname();

  // Only show the empty-state hint on company detail pages
  const isCompanyPage = /^\/job-seeker\/[^/]+$/.test(pathname);

  if (companies.length === 0) {
    if (!isCompanyPage) return null;
    return (
      <div className="fixed bottom-[48px] md:bottom-0 left-0 right-0 z-50 bg-cream/95 border-t border-ink/10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-dashed border-ink/20 flex-shrink-0" />
          <span className="text-xs text-warmgray/60 font-sans">
            Start comparing — tap <strong className="font-medium text-warmgray">+ Compare</strong> to add this company
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[48px] md:bottom-0 left-0 right-0 z-50 bg-cream border-t-2 border-ink/20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans flex items-center gap-1.5">
            Comparing
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-terracotta text-white text-[9px] font-bold font-sans leading-none">
              {companies.length}
            </span>
            <span className="text-warmgray/50">/ 3</span>
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
