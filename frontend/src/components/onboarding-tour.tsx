"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "Search a Company",
    description: "Use the search bar at the top to find any Indian company. We have data on ratings, salaries, benefits, and employee reviews.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Compare Side by Side",
    description: "On any company page, click \u201c+ Compare\u201d. Add up to 3 companies, then see ratings, salaries, and benefits compared at a glance.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Calculate Your Offer",
    description: "Have two offers? Use the Offer Calculator to compare total compensation with cost-of-living adjustment, and get a personalized recommendation.",
  },
];

const STORAGE_KEY = "jc-onboarding-complete-v2";

export function OnboardingTour() {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setStep(0), 1800);
    return () => clearTimeout(t);
  }, []);

  const finish = useCallback(() => {
    setStep(-1);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  const next = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finish]);

  if (step < 0 || step >= TOUR_STEPS.length) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="tour-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9998] bg-ink/50 flex items-center justify-center p-6"
        onClick={finish}
      >
        {/* Card */}
        <motion.div
          key={`tour-card-${step}`}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink/10 bg-cream">
            <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">
              Quick Tour — {step + 1} / {TOUR_STEPS.length}
            </span>
            <button
              onClick={finish}
              className="text-warmgray/50 hover:text-warmgray transition-colors text-base leading-none"
              aria-label="Close tour"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-terracotta/10 flex items-center justify-center text-terracotta">
                {current.icon}
              </div>
            </div>
            <h3 className="font-serif font-bold text-ink text-lg text-center mb-2">{current.title}</h3>
            <p className="text-sm text-warmgray font-sans leading-relaxed text-center">{current.description}</p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between">
            <button
              onClick={finish}
              className="text-[10px] uppercase tracking-[0.1em] text-warmgray hover:text-ink font-sans transition-colors"
            >
              Skip
            </button>
            <div className="flex items-center gap-3">
              {/* Dots */}
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${i === step ? "bg-terracotta" : "bg-ink/15"}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="text-[10px] uppercase tracking-[0.1em] px-4 py-2 bg-terracotta text-white font-sans hover:bg-terracotta/90 transition-colors"
              >
                {isLast ? "Let\u2019s go" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
