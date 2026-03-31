"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ReviewFormProps {
  slug: string;
  companyName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label={`${label} rating`}>
      <span className="text-sm text-gray-600 min-w-[120px]">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" && value < 5) onChange(value + 1);
              if (e.key === "ArrowLeft" && value > 1) onChange(value - 1);
            }}
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={star <= value}
            className={`text-xl transition-colors min-w-[28px] min-h-[28px] ${star <= value ? "text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`}
          >
            &#9733;
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ slug, companyName, onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Role & status
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [isCurrentEmployee, setIsCurrentEmployee] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Step 2: Ratings
  const [overallRating, setOverallRating] = useState(0);
  const [workLifeBalanceRating, setWorkLifeBalanceRating] = useState(0);
  const [salaryRating, setSalaryRating] = useState(0);
  const [jobSecurityRating, setJobSecurityRating] = useState(0);
  const [careerGrowthRating, setCareerGrowthRating] = useState(0);
  const [companyCultureRating, setCompanyCultureRating] = useState(0);

  // Step 3: Pros & cons
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-muted-foreground">Sign in to submit a review</p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          role,
          location: location || null,
          overallRating,
          workLifeBalanceRating: workLifeBalanceRating || null,
          salaryRating: salaryRating || null,
          jobSecurityRating: jobSecurityRating || null,
          careerGrowthRating: careerGrowthRating || null,
          companyCultureRating: companyCultureRating || null,
          pros,
          cons,
          isAnonymous,
          isCurrentEmployee,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review");
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
        <CardTitle className="text-base">Review {companyName}</CardTitle>
        <div className="flex gap-1.5 mt-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-blue-600" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Step {step} of 3: {step === 1 ? "About You" : step === 2 ? "Ratings" : "Your Review"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{error}</div>
        )}

        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Review Title *</label>
              <Input
                placeholder='e.g. "Great work culture but average pay"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
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
            <div className="flex flex-wrap gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isCurrentEmployee}
                  onChange={(e) => setIsCurrentEmployee(e.target.checked)}
                  className="rounded"
                />
                I currently work here
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded"
                />
                Post anonymously
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!title.trim() || !role.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3">
              <StarInput value={overallRating} onChange={setOverallRating} label="Overall *" />
              <StarInput value={workLifeBalanceRating} onChange={setWorkLifeBalanceRating} label="Work-Life Balance" />
              <StarInput value={salaryRating} onChange={setSalaryRating} label="Salary & Benefits" />
              <StarInput value={jobSecurityRating} onChange={setJobSecurityRating} label="Job Security" />
              <StarInput value={careerGrowthRating} onChange={setCareerGrowthRating} label="Career Growth" />
              <StarInput value={companyCultureRating} onChange={setCompanyCultureRating} label="Culture" />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={overallRating === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pros *</label>
              <textarea
                placeholder="What do you like about working here?"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs text-muted-foreground">{pros.length}/2000</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cons *</label>
              <textarea
                placeholder="What could be improved?"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                maxLength={2000}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs text-muted-foreground">{cons.length}/2000</span>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !pros.trim() || !cons.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
