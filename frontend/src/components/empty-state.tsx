"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  variant: "compare" | "search" | "reviews" | "salaries" | "interviews";
  query?: string;
  companyName?: string;
}

function CompareIllustration() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" className="mx-auto">
      {/* Left card */}
      <motion.rect
        x="16" y="24" width="60" height="76" rx="4"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"
        className="text-ink/20"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      />
      <motion.rect x="26" y="38" width="40" height="4" rx="2" className="fill-ink/10"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.4 }} style={{ transformOrigin: "left" }} />
      <motion.rect x="26" y="48" width="28" height="4" rx="2" className="fill-ink/8"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.4 }} style={{ transformOrigin: "left" }} />
      <motion.rect x="26" y="62" width="40" height="20" rx="3" className="fill-terracotta/8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />

      {/* Right card */}
      <motion.rect
        x="104" y="24" width="60" height="76" rx="4"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"
        className="text-ink/20"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      />
      <motion.rect x="114" y="38" width="40" height="4" rx="2" className="fill-ink/10"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.4 }} style={{ transformOrigin: "left" }} />
      <motion.rect x="114" y="48" width="28" height="4" rx="2" className="fill-ink/8"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.4 }} style={{ transformOrigin: "left" }} />
      <motion.rect x="114" y="62" width="40" height="20" rx="3" className="fill-terracotta/8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />

      {/* VS circle */}
      <motion.circle cx="90" cy="62" r="14" className="fill-cream stroke-terracotta/30" strokeWidth="1.5"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 200 }} />
      <motion.text x="90" y="66" textAnchor="middle" className="fill-terracotta text-[11px] font-sans font-bold"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        VS
      </motion.text>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mx-auto">
      {/* Magnifying glass */}
      <motion.circle cx="72" cy="52" r="24" className="stroke-ink/20" strokeWidth="2"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 150 }} />
      <motion.line x1="90" y1="70" x2="110" y2="90" className="stroke-ink/20" strokeWidth="3" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
      {/* X in the glass */}
      <motion.path d="M64 44 L80 60 M80 44 L64 60" className="stroke-terracotta/40" strokeWidth="2" strokeLinecap="round"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
    </svg>
  );
}

function ReviewsIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mx-auto">
      {/* Chat bubbles */}
      <motion.rect x="30" y="28" width="70" height="30" rx="6" className="fill-ink/5 stroke-ink/15" strokeWidth="1"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} />
      <motion.rect x="40" y="38" width="40" height="3" rx="1.5" className="fill-ink/10"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.3 }} style={{ transformOrigin: "left" }} />
      <motion.rect x="40" y="45" width="28" height="3" rx="1.5" className="fill-ink/8"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.3 }} style={{ transformOrigin: "left" }} />

      <motion.rect x="60" y="68" width="70" height="30" rx="6" className="fill-terracotta/5 stroke-terracotta/15" strokeWidth="1"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} />
      <motion.rect x="70" y="78" width="40" height="3" rx="1.5" className="fill-terracotta/15"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.3 }} style={{ transformOrigin: "left" }} />
      <motion.rect x="70" y="85" width="28" height="3" rx="1.5" className="fill-terracotta/10"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.3 }} style={{ transformOrigin: "left" }} />
    </svg>
  );
}

function SalariesIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mx-auto">
      {/* Bar chart */}
      {[
        { x: 35, h: 40, delay: 0.1 },
        { x: 55, h: 55, delay: 0.2 },
        { x: 75, h: 35, delay: 0.3 },
        { x: 95, h: 65, delay: 0.4 },
        { x: 115, h: 45, delay: 0.5 },
      ].map(({ x, h, delay }) => (
        <motion.rect
          key={x}
          x={x} y={100 - h} width="12" height={h} rx="2"
          className="fill-terracotta/15 stroke-terracotta/25" strokeWidth="0.5"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay, duration: 0.4, ease: "easeOut" }}
          style={{ transformOrigin: `${x + 6}px 100px` }}
        />
      ))}
      {/* Baseline */}
      <motion.line x1="30" y1="100" x2="132" y2="100" className="stroke-ink/15" strokeWidth="1"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1, duration: 0.3 }} style={{ transformOrigin: "left" }} />
      {/* Rupee symbol */}
      <motion.text x="80" y="28" textAnchor="middle" className="fill-terracotta/30 text-lg font-serif font-bold"
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        ?
      </motion.text>
    </svg>
  );
}

function InterviewsIllustration() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mx-auto">
      {/* Question marks */}
      <motion.text x="50" y="55" className="fill-ink/10 text-3xl font-serif"
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>?</motion.text>
      <motion.text x="80" y="45" className="fill-terracotta/20 text-4xl font-serif font-bold"
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>?</motion.text>
      <motion.text x="105" y="60" className="fill-ink/10 text-2xl font-serif"
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>?</motion.text>
      {/* Lines representing questions */}
      <motion.rect x="40" y="72" width="80" height="3" rx="1.5" className="fill-ink/8"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.3 }} style={{ transformOrigin: "center" }} />
      <motion.rect x="50" y="82" width="60" height="3" rx="1.5" className="fill-ink/6"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.3 }} style={{ transformOrigin: "center" }} />
      <motion.rect x="55" y="92" width="50" height="3" rx="1.5" className="fill-ink/5"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.3 }} style={{ transformOrigin: "center" }} />
    </svg>
  );
}

const ILLUSTRATIONS = {
  compare: CompareIllustration,
  search: SearchIllustration,
  reviews: ReviewsIllustration,
  salaries: SalariesIllustration,
  interviews: InterviewsIllustration,
};

const CONTENT: Record<string, { title: string; description: string; cta?: { label: string; href: string } }> = {
  compare: {
    title: "Nothing to compare yet",
    description: "Browse companies and tap \"+ Compare\" to add them here. You can compare up to 3 companies side by side.",
    cta: { label: "Browse Companies", href: "/job-seeker" },
  },
  search: {
    title: "No companies found",
    description: "We couldn't find what you're looking for. Try a different search term or browse our company directory.",
    cta: { label: "Browse All Companies", href: "/job-seeker" },
  },
  reviews: {
    title: "No reviews yet",
    description: "Be the first to share your experience at this company. Your review helps others make informed career decisions.",
  },
  salaries: {
    title: "No salary data yet",
    description: "Salary information for this company isn't available yet. Help the community by submitting yours anonymously.",
  },
  interviews: {
    title: "No interview insights",
    description: "Interview data for this company hasn't been collected yet. Check back after the next data refresh.",
  },
};

export function EmptyState({ variant, query, companyName }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];
  const content = CONTENT[variant];

  const title = variant === "search" && query
    ? `No results for "${query}"`
    : content.title;

  const description = companyName
    ? content.description.replace("this company", companyName)
    : content.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-center py-12 px-6"
    >
      <Illustration />
      <h3 className="font-serif font-bold text-ink text-lg mt-6 mb-2">{title}</h3>
      <p className="text-warmgray text-sm font-sans max-w-sm leading-relaxed">{description}</p>
      {content.cta && (
        <Link
          href={content.cta.href}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 border-2 border-terracotta text-terracotta text-xs uppercase tracking-[0.1em] font-sans font-medium hover:bg-terracotta hover:text-white transition-colors"
        >
          {content.cta.label}
        </Link>
      )}
    </motion.div>
  );
}
