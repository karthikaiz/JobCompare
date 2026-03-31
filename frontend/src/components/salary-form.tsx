"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface SalaryFormProps {
  slug: string;
  companyName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const EXPERIENCE_RANGES = [
  "0-1 years",
  "1-3 years",
  "3-5 years",
  "5-8 years",
  "8-12 years",
  "12-15 years",
  "15+ years",
];

export function SalaryForm({ slug, companyName, onSuccess, onCancel }: SalaryFormProps) {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [totalComp, setTotalComp] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-muted-foreground">Sign in to submit salary data</p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const base = parseFloat(baseSalary);
    if (!role.trim() || isNaN(base) || base <= 0) {
      setError("Role and base salary are required");
      return;
    }

    const total = totalComp ? parseFloat(totalComp) : null;
    if (total != null && (isNaN(total) || total < 0)) {
      setError("Invalid total compensation");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          role: role.trim(),
          location: location.trim() || null,
          baseSalary: base,
          totalComp: total,
          experience: experience || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Share Salary at {companyName}</CardTitle>
        <p className="text-xs text-muted-foreground">Your data is anonymous and helps others make informed decisions.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{error}</div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Your Role *</label>
            <Input
              placeholder="e.g. Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Location (optional)</label>
            <Input
              placeholder="e.g. Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Base Salary (INR/year) *</label>
              <Input
                type="number"
                placeholder="e.g. 1200000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Total Comp (optional)</label>
              <Input
                type="number"
                placeholder="Including bonuses, stocks"
                value={totalComp}
                onChange={(e) => setTotalComp(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Experience</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setExperience(experience === range ? "" : range)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    experience === range
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? "Submitting..." : "Submit Salary"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
