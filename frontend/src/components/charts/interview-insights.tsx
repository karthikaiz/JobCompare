"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/empty-state";

interface InterviewQuestion {
  question: string;
  answer: string | null;
}

interface Interview {
  id: string;
  role: string | null;
  difficulty: string | null;
  experience: string | null;
  process: string | null;
  questions: InterviewQuestion[] | null;
  reviewDate: string | null;
}

interface InterviewInsightsProps {
  interviews: Interview[];
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy:   { label: "Easy",     color: "#4A7C59" },
  medium: { label: "Moderate", color: "#C49A3C" },
  hard:   { label: "Hard",     color: "#B05252" },
};

const EXPERIENCE_LABELS: Record<string, { label: string; color: string }> = {
  positive: { label: "Positive", color: "#4A7C59" },
  neutral:  { label: "Neutral",  color: "#6b6559" },
  negative: { label: "Negative", color: "#B05252" },
};

function RoleRow({ role, data }: {
  role: string;
  data: { difficulty: string | null; experience: string | null; questions: Set<string> };
}) {
  const [open, setOpen] = useState(false);
  const questions = Array.from(data.questions);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex flex-col px-3 py-2.5 hover:bg-ink/[0.02] transition-colors text-left gap-1"
      >
        {/* Row 1: role name + chevron */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold font-sans text-ink truncate">{role}</span>
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-3.5 h-3.5 text-warmgray/40 flex-shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>

        {/* Row 2: badges + count */}
        <div className="flex items-center gap-1.5">
          {data.difficulty && (
            <span className="text-[10px] px-1.5 py-0.5 border" style={{
              borderColor: `${DIFFICULTY_LABELS[data.difficulty]?.color}40`,
              color: DIFFICULTY_LABELS[data.difficulty]?.color,
            }}>
              {DIFFICULTY_LABELS[data.difficulty]?.label}
            </span>
          )}
          {data.experience && (
            <span className="text-[10px] px-1.5 py-0.5 border" style={{
              borderColor: `${EXPERIENCE_LABELS[data.experience]?.color}40`,
              color: EXPERIENCE_LABELS[data.experience]?.color,
            }}>
              {EXPERIENCE_LABELS[data.experience]?.label}
            </span>
          )}
          <span className="text-[10px] text-warmgray/50">{questions.length} questions</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-ink/8 bg-ink/[0.015]">
              {questions.map((q, i) => (
                <p key={i} className="text-[11px] font-sans text-ink/70 leading-snug">
                  <span className="text-warmgray/40 mr-1.5 select-none">{i + 1}.</span>
                  {q}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InterviewInsights({ interviews }: InterviewInsightsProps) {
  const [showAll, setShowAll] = useState(false);

  if (interviews.length === 0) {
    return <EmptyState variant="interviews" />;
  }

  // Aggregate stats
  const total = interviews.length;
  const difficultyCount: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const experienceCount: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };

  for (const iv of interviews) {
    if (iv.difficulty && difficultyCount[iv.difficulty] !== undefined) difficultyCount[iv.difficulty]++;
    if (iv.experience && experienceCount[iv.experience] !== undefined) experienceCount[iv.experience]++;
  }

  const topDifficulty = Object.entries(difficultyCount).sort((a, b) => b[1] - a[1])[0];
  const topExperience = Object.entries(experienceCount).sort((a, b) => b[1] - a[1])[0];

  // Process steps
  const allSteps = new Map<string, number>();
  for (const iv of interviews) {
    if (!iv.process) continue;
    for (const step of iv.process.split(",").map((s) => s.trim()).filter(Boolean)) {
      allSteps.set(step.toLowerCase(), (allSteps.get(step.toLowerCase()) ?? 0) + 1);
    }
  }
  const topSteps = Array.from(allSteps.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Group by role — collect unique questions per role across all interviews
  const roleMap = new Map<string, {
    difficulty: string | null;
    experience: string | null;
    questions: Set<string>;
  }>();

  for (const iv of interviews) {
    if (!iv.role || !iv.questions || iv.questions.length === 0) continue;
    const role = iv.role.trim();
    if (!role) continue;

    if (!roleMap.has(role)) {
      roleMap.set(role, { difficulty: iv.difficulty, experience: iv.experience, questions: new Set() });
    }
    for (const q of iv.questions) {
      if (q.question?.trim()) roleMap.get(role)!.questions.add(q.question.trim());
    }
  }

  // Sort roles by number of unique questions descending
  const roles = Array.from(roleMap.entries())
    .filter(([, v]) => v.questions.size > 0)
    .sort((a, b) => b[1].questions.size - a[1].questions.size);

  const INITIAL_SHOW = 5;
  const displayed = showAll ? roles : roles.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 divide-x divide-ink/10 border border-ink/10">
        <div className="flex flex-col items-center py-3">
          <span className="font-serif font-bold text-terracotta text-xl">{total}</span>
          <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Interviews</span>
        </div>
        <div className="flex flex-col items-center py-3">
          {topDifficulty && topDifficulty[1] > 0 ? (
            <>
              <span className="font-serif font-bold text-xl" style={{ color: DIFFICULTY_LABELS[topDifficulty[0]]?.color }}>
                {DIFFICULTY_LABELS[topDifficulty[0]]?.label ?? topDifficulty[0]}
              </span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Avg Difficulty</span>
            </>
          ) : (
            <>
              <span className="font-serif font-bold text-xl text-ink/30">—</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Difficulty</span>
            </>
          )}
        </div>
        <div className="flex flex-col items-center py-3">
          {topExperience && topExperience[1] > 0 ? (
            <>
              <span className="font-serif font-bold text-xl" style={{ color: EXPERIENCE_LABELS[topExperience[0]]?.color }}>
                {EXPERIENCE_LABELS[topExperience[0]]?.label ?? topExperience[0]}
              </span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Experience</span>
            </>
          ) : (
            <>
              <span className="font-serif font-bold text-xl text-ink/30">—</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">Experience</span>
            </>
          )}
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-warmgray font-sans">Difficulty Breakdown</p>
        {Object.entries(difficultyCount).map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const meta = DIFFICULTY_LABELS[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-16 text-[11px] font-sans text-warmgray text-right">{meta?.label ?? key}</span>
              <div className="flex-1 h-1.5 bg-ink/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full"
                  style={{ backgroundColor: meta?.color ?? "#6b6559" }}
                />
              </div>
              <span className="text-[11px] font-sans text-warmgray w-8">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Common process steps */}
      {topSteps.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-warmgray font-sans mb-2">Common Process Steps</p>
          <div className="flex flex-wrap gap-1.5">
            {topSteps.map(([step, count]) => (
              <span key={step} className="text-[11px] border border-ink/15 text-ink/70 px-2 py-0.5 font-sans">
                {step}
                <span className="ml-1 text-[9px] text-warmgray/60">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Questions grouped by role — collapsible */}
      {roles.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-warmgray font-sans mb-2">Interview Questions by Role</p>

          <div className="divide-y divide-ink/8 border border-ink/8">
            {displayed.map(([role, data]) => (
              <RoleRow key={role} role={role} data={data} />
            ))}
          </div>

          {roles.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="mt-2 text-[11px] text-warmgray/60 hover:text-warmgray transition-colors font-sans"
            >
              {showAll ? "Show less ↑" : `Show all ${roles.length} roles ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
