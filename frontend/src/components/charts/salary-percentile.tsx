"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Salary {
  role: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number | null;
}

interface SalaryPercentileProps {
  salaries: Salary[];
}

function fmt(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000)   return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000)     return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function SalaryRow({ s, maxAvg, index }: { s: Salary; maxAvg: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const avg = s.avgSalary ?? Math.round((s.minSalary + s.maxSalary) / 2);
  const barPct = maxAvg > 0 ? (avg / maxAvg) * 100 : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="px-3 py-3 space-y-1.5"
    >
      {/* Role + range */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-sans text-ink truncate">{s.role}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.06 + 0.2 }}
          className="text-xs font-sans text-warmgray whitespace-nowrap flex-shrink-0"
        >
          ₹{fmt(s.minSalary)} – ₹{fmt(s.maxSalary)}
        </motion.span>
      </div>

      {/* Bar + avg */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-ink/6 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-terracotta/50 rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.7, delay: index * 0.06 + 0.15, ease: "easeOut" }}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: index * 0.06 + 0.35 }}
          className="text-[11px] font-sans text-terracotta font-medium whitespace-nowrap flex-shrink-0"
        >
          avg ₹{fmt(avg)}
        </motion.span>
      </div>
    </motion.div>
  );
}

export function SalaryPercentile({ salaries }: SalaryPercentileProps) {
  if (salaries.length === 0) return null;

  const sorted = [...salaries]
    .slice(0, 12)
    .sort((a, b) => {
      const avgA = a.avgSalary ?? (a.minSalary + a.maxSalary) / 2;
      const avgB = b.avgSalary ?? (b.minSalary + b.maxSalary) / 2;
      return avgB - avgA;
    });

  const maxAvg = Math.max(...sorted.map(s => s.avgSalary ?? (s.minSalary + s.maxSalary) / 2));

  return (
    <div className="divide-y divide-ink/8 border border-ink/8">
      {sorted.map((s, i) => (
        <SalaryRow key={s.role} s={s} maxAvg={maxAvg} index={i} />
      ))}
    </div>
  );
}
