"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL || "http://localhost:8000";

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

export default function RegistryPage() {
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
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Company Registry</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage which companies the scraper monitors. Changes take effect on the next scrape cycle.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold">{companies.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-green-600">{scraped}</div>
              <div className="text-xs text-gray-500">Scraped</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-red-600">{failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-gray-400">{pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Company */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Company name (e.g. Accenture)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCompany()}
                className="flex-1 min-w-[180px]"
              />
              <Input
                placeholder="Industry (optional)"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="w-full sm:w-48"
              />
              <Button onClick={addCompany} disabled={adding || !newName.trim()} className="w-full sm:w-auto">
                {adding ? "Discovering..." : "Add"}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Auto-discovers the company profile. Works with company names, abbreviations, and brand names.
            </p>
            {message && (
              <div
                className={`mt-3 text-sm px-3 py-2 rounded ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
                {message.type === "error" && (
                  <button onClick={fetchCompanies} className="ml-2 underline font-medium">Retry</button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Companies ({filteredCompanies.length})</CardTitle>
              <Input
                placeholder="Filter..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400 text-center py-8">Loading...</p>
            ) : (
              <div className="divide-y">
                {filteredCompanies.map((company) => (
                  <div key={company.slug} className="flex items-center justify-between py-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium truncate">{company.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {company.industry}
                        </Badge>
                        {company.status === "success" && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Scraped</Badge>
                        )}
                        {company.status === "failed" && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Failed</Badge>
                        )}
                        {!company.status && (
                          <Badge className="bg-gray-100 text-gray-500 text-xs">Pending</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {company.slug}
                        {company.status === "success" && (
                          <span>
                            {" "}
                            &middot; {company.reviews} reviews, {company.salaries} salaries,{" "}
                            {company.benefits} benefits &middot; Last: {formatDate(company.last_scraped)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeCompany(company.slug, company.name)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
