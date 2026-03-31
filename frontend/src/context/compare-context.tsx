"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface CompareCompany {
  slug: string;
  name: string;
}

interface CompareContextType {
  companies: CompareCompany[];
  addCompany: (company: CompareCompany) => void;
  removeCompany: (slug: string) => void;
  isSelected: (slug: string) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_COMPARE = 3;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<CompareCompany[]>([]);

  const addCompany = useCallback((company: CompareCompany) => {
    setCompanies((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((c) => c.slug === company.slug)) return prev;
      return [...prev, company];
    });
  }, []);

  const removeCompany = useCallback((slug: string) => {
    setCompanies((prev) => prev.filter((c) => c.slug !== slug));
  }, []);

  const isSelected = useCallback(
    (slug: string) => companies.some((c) => c.slug === slug),
    [companies]
  );

  const clear = useCallback(() => setCompanies([]), []);

  return (
    <CompareContext.Provider value={{ companies, addCompany, removeCompany, isSelected, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
