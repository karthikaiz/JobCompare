"use client";

import Link from "next/link";
import { useCompare } from "@/context/compare-context";
import { Button } from "@/components/ui/button";

export function CompareBar() {
  const { companies, removeCompany, clear } = useCompare();

  if (companies.length === 0) return null;

  return (
    <div className="fixed bottom-[48px] md:bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Compare ({companies.length}/3):
          </span>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <span
                key={c.slug}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-2.5 py-1 rounded-full"
              >
                {c.name}
                <button
                  onClick={() => removeCompany(c.slug)}
                  className="hover:text-blue-900 ml-0.5 min-w-[24px] min-h-[24px] inline-flex items-center justify-center"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear} className="text-xs">
            Clear
          </Button>
          {companies.length >= 2 && (
            <Link href="/job-seeker/compare">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Compare Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
