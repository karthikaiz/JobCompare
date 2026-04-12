"use client";

import { useState, useEffect, useCallback } from "react";

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL ?? "";

interface Company {
  name: string;
  slug: string;
  industry: string;
  status: string | null;
  last_scraped: string | null;
  reviews: number | null;
  salaries: number | null;
  benefits: number | null;
}

const STATUS_STYLES = {
  success: "bg-[#4A7C59]/15 text-[#4A7C59] border-[#4A7C59]/20",
  failed: "bg-[#B05252]/15 text-[#B05252] border-[#B05252]/20",
  pending: "bg-white/5 text-white/30 border-white/10",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState("");

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${SCRAPER_URL}/registry`);
      const data = await res.json();
      setCompanies(data);
    } catch {
      setMessage({ text: "Failed to load registry. Is the scraper running on port 8000?", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch(`${SCRAPER_URL}/registry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, industry: newIndustry || "Other" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setNewName("");
        setNewIndustry("");
        fetchCompanies();
      } else {
        setMessage({ text: data.detail || "Failed to add company", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error. Is the scraper running?", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const removeCompany = async (slug: string, name: string) => {
    if (!confirm(`Remove "${name}" from the registry?`)) return;
    try {
      const res = await fetch(`${SCRAPER_URL}/registry/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        fetchCompanies();
      } else {
        setMessage({ text: data.detail || "Failed to remove", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.industry.toLowerCase().includes(filter.toLowerCase()) ||
      c.slug.toLowerCase().includes(filter.toLowerCase())
  );

  const scraped = companies.filter((c) => c.status === "success").length;
  const failed = companies.filter((c) => c.status === "failed").length;
  const pending = companies.filter((c) => !c.status).length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-serif font-bold text-cream">Companies</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage which companies the scraper monitors. Changes take effect on next scrape cycle.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: companies.length, color: "text-cream" },
          { label: "Scraped", value: scraped, color: "text-[#4A7C59]" },
          { label: "Failed", value: failed, color: "text-[#B05252]" },
          { label: "Pending", value: pending, color: "text-white/30" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 rounded-sm border border-white/8 bg-white/2 text-center">
            <div className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5 font-sans">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="mb-6 p-5 rounded-sm border border-white/8 bg-white/2">
        <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-sans">Add Company</p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Company name (e.g. Accenture)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCompany()}
            className="flex-1 bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-cream placeholder:text-white/20 focus:outline-none focus:border-white/25 font-sans"
          />
          <input
            type="text"
            placeholder="Industry"
            value={newIndustry}
            onChange={(e) => setNewIndustry(e.target.value)}
            className="w-44 bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-sm text-cream placeholder:text-white/20 focus:outline-none focus:border-white/25 font-sans"
          />
          <button
            onClick={addCompany}
            disabled={adding || !newName.trim()}
            className="px-4 py-2 text-sm bg-terracotta/90 hover:bg-terracotta text-cream rounded-sm disabled:opacity-40 transition-colors font-sans"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
        <p className="text-[11px] text-white/25 mt-2 font-sans">
          Auto-discovers the company profile on AmbitionBox. Works with names, abbreviations, and brand names.
        </p>
        {message && (
          <div
            className={`mt-3 text-xs px-3 py-2 rounded-sm border font-sans ${
              message.type === "success"
                ? "bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20"
                : "bg-[#B05252]/10 text-[#B05252] border-[#B05252]/20"
            }`}
          >
            {message.text}
            {message.type === "error" && (
              <button onClick={fetchCompanies} className="ml-2 underline">Retry</button>
            )}
          </div>
        )}
      </div>

      {/* Company table */}
      <div className="rounded-sm border border-white/8 bg-white/2 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <span className="text-xs uppercase tracking-widest text-white/30 font-sans">
            Companies ({filteredCompanies.length})
          </span>
          <input
            type="text"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-56 bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-xs text-cream placeholder:text-white/20 focus:outline-none focus:border-white/25 font-sans"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-white/25 font-sans">Loading registry…</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/25 font-sans">
            {filter ? "No companies match the filter." : "Registry is empty. Add a company above."}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredCompanies.map((company) => {
              const statusKey = company.status === "success" ? "success" : company.status === "failed" ? "failed" : "pending";
              return (
                <div key={company.slug} className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-cream font-medium font-sans">{company.name}</span>
                      <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded-sm font-sans">
                        {company.industry}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-sans ${STATUS_STYLES[statusKey]}`}>
                        {statusKey === "success" ? "Scraped" : statusKey === "failed" ? "Failed" : "Pending"}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/25 mt-0.5 font-mono">
                      {company.slug}
                      {company.status === "success" && (
                        <span className="font-sans ml-2 text-white/20">
                          · {company.reviews} reviews · {company.salaries} salaries · {company.benefits} benefits
                          · Last: {formatDate(company.last_scraped)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeCompany(company.slug, company.name)}
                    className="text-[11px] text-white/25 hover:text-[#B05252] transition-colors font-sans px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
