"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface Company {
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
}

interface SearchBarProps {
  basePath: string; // "/job-seeker" or "/recruiter"
  placeholder?: string;
  initialQuery?: string;
}

export function SearchBar({ basePath, placeholder, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCompany = (slug: string) => {
    setIsOpen(false);
    router.push(`${basePath}/${slug}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <Input
        placeholder={placeholder || "Search companies..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="h-11"
      />
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map((company) => (
            <button
              key={company.slug}
              onClick={() => selectCompany(company.slug)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                {company.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{company.name}</div>
                <div className="text-xs text-muted-foreground">{company.industry}</div>
              </div>
              {company.overallRating != null && (
                <div className="text-sm font-medium text-yellow-600">
                  {company.overallRating.toFixed(1)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          No companies found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
