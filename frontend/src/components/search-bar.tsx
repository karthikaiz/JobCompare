"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Company {
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
}

interface SearchBarProps {
  basePath: string;
  placeholder?: string;
  initialQuery?: string;
}

export function SearchBar({ basePath, placeholder, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setIsOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/companies?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.companies || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCompany = (slug: string) => {
    setIsOpen(false);
    router.push(`${basePath}/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit} className={`flex border-2 transition-colors duration-200 ${focused ? "border-terracotta" : "border-ink/20"}`}>
        <input
          type="text"
          placeholder={placeholder || "Search companies..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length > 0) setIsOpen(true); }}
          onBlur={() => setFocused(false)}
          className="flex-1 h-11 px-4 text-sm text-ink placeholder:text-warmgray/55 bg-card outline-none font-sans"
        />
        {loading ? (
          <div className="h-11 w-11 flex items-center justify-center bg-card flex-shrink-0">
            <div className="w-4 h-4 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
          </div>
        ) : (
          <button type="submit" className="h-11 px-4 bg-ink text-cream text-xs uppercase tracking-[0.12em] font-medium font-sans hover:bg-terracotta transition-colors flex-shrink-0">
            Search
          </button>
        )}
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border border-ink/15 shadow-[0_4px_24px_rgba(26,21,4,0.1)] z-[60] overflow-hidden">
          {results.map((company) => (
            <button
              key={company.slug}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCompany(company.slug)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-terracotta/5 transition-colors text-left border-b border-ink/8 last:border-0 group"
            >
              <div className="w-8 h-8 bg-terracotta/10 flex items-center justify-center text-terracotta font-bold text-xs flex-shrink-0 font-serif">
                {company.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-ink font-sans group-hover:text-terracotta transition-colors">{company.name}</div>
                {company.industry && <div className="text-xs text-warmgray font-sans">{company.industry}</div>}
              </div>
              {company.overallRating != null && (
                <div className="text-sm font-bold font-mono text-terracotta flex-shrink-0">
                  {company.overallRating.toFixed(1)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1 w-full bg-card border border-ink/15 shadow-[0_4px_24px_rgba(26,21,4,0.08)] z-50 p-5 text-center font-sans">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-2">
            <circle cx="22" cy="22" r="10" className="stroke-ink/15" strokeWidth="2" />
            <line x1="29" y1="29" x2="38" y2="38" className="stroke-ink/15" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M18 19 L26 27 M26 19 L18 27" className="stroke-terracotta/40" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-warmgray">No companies found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-warmgray/60 mt-1">Can&apos;t find your company? Try a different name.</p>
        </div>
      )}
    </div>
  );
}
