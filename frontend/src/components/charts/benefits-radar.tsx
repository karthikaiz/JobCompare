"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface BenefitsRadarProps {
  workLifeBalance: number | null;
  salaryBenefits: number | null;
  jobSecurity: number | null;
  careerGrowth: number | null;
  companyCulture: number | null;
}

const CX = 160;
const CY = 158;
const MAX_R = 90;
const LABEL_R = 116;

const AXES = [
  { label: "Work-Life", angle: -90 },
  { label: "Salary", angle: -18 },
  { label: "Security", angle: 54 },
  { label: "Growth", angle: 126 },
  { label: "Culture", angle: 198 },
];

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polar(r: number, deg: number) {
  return {
    x: CX + r * Math.cos(toRad(deg)),
    y: CY + r * Math.sin(toRad(deg)),
  };
}

function pts(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

export function BenefitsRadar({
  workLifeBalance, salaryBenefits, jobSecurity, careerGrowth, companyCulture,
}: BenefitsRadarProps) {
  const values = [
    workLifeBalance ?? 0,
    salaryBenefits ?? 0,
    jobSecurity ?? 0,
    careerGrowth ?? 0,
    companyCulture ?? 0,
  ];

  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });

  // Animate a single progress value 0→1 driving the polygon scale
  const [progress, setProgress] = useState(0);
  const [dotsVisible, setDotsVisible] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1100;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out with slight overshoot (approx back-out)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * (2 * Math.PI) / 3) * 0.15 + 0.0;
      setProgress(Math.min(eased, 1));
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(() => setDotsVisible(true), 80);
    }
    requestAnimationFrame(tick);
  }, [inView]);

  // Live polygon points (scale from center as progress grows)
  const liveDataPts = AXES.map((axis, i) => polar((values[i] / 5) * MAX_R * progress, axis.angle));

  // Final polygon points (used for dots)
  const finalDataPts = AXES.map((axis, i) => polar((values[i] / 5) * MAX_R, axis.angle));

  // Grid levels
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div className="w-full">
      <svg
        ref={ref}
        viewBox="0 0 320 316"
        className="w-full"
        style={{ overflow: "visible" }}
      >
        {/* ── Background grid pentagons ── */}
        {gridLevels.map((lvl, li) => {
          const r = (lvl / 5) * MAX_R;
          const gridPts = AXES.map((a) => polar(r, a.angle));
          return (
            <motion.polygon
              key={lvl}
              points={pts(gridPts)}
              fill={lvl === 5 ? "rgba(196,113,74,0.04)" : "none"}
              stroke="rgba(26,21,4,0.10)"
              strokeWidth={lvl === 5 ? 1.5 : 0.8}
              strokeDasharray={lvl === 5 ? "none" : "3,3"}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.05 + li * 0.07, duration: 0.5 }}
            />
          );
        })}

        {/* ── Axis spoke lines ── */}
        {AXES.map((axis, i) => {
          const end = polar(MAX_R, axis.angle);
          return (
            <motion.line
              key={i}
              x1={CX} y1={CY}
              x2={end.x} y2={end.y}
              stroke="rgba(26,21,4,0.12)"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.55 }}
            />
          );
        })}

        {/* ── Live data polygon — grows from center ── */}
        <polygon
          points={pts(liveDataPts)}
          fill="rgba(196,113,74,0.18)"
          stroke="#C4714A"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* ── Grid level numbers ── */}
        {[1, 2, 3, 4, 5].map((lvl) => {
          const pt = polar((lvl / 5) * MAX_R, -90);
          return (
            <motion.text
              key={lvl}
              x={pt.x + 5}
              y={pt.y + 4}
              fontSize="9"
              fill="rgba(26,21,4,0.25)"
              fontFamily="var(--font-geist-mono), monospace"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {lvl}
            </motion.text>
          );
        })}

        {/* ── Value dots — spring pop ── */}
        {finalDataPts.map((pt, i) => (
          <motion.circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={5}
            fill="white"
            stroke="#C4714A"
            strokeWidth={2.5}
            initial={{ scale: 0, opacity: 0 }}
            animate={dotsVisible ? { scale: 1, opacity: 1 } : {}}
            style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
            transition={{ delay: i * 0.08, duration: 0.4, type: "spring", stiffness: 500, damping: 18 }}
          />
        ))}

        {/* ── Axis labels + values ── */}
        {AXES.map((axis, i) => {
          const lp = polar(LABEL_R, axis.angle);
          const isLeft = lp.x < CX - 8;
          const isRight = lp.x > CX + 8;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";
          const v = values[i];

          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55 + i * 0.1, duration: 0.45 }}
            >
              {/* Short label */}
              <text
                x={lp.x}
                y={lp.y - 5}
                textAnchor={anchor}
                fontSize="10"
                fill="#6b6559"
                fontFamily="var(--font-geist-sans), sans-serif"
                letterSpacing="0.06em"
                style={{ textTransform: "uppercase" }}
              >
                {axis.label}
              </text>
              {/* Value */}
              <text
                x={lp.x}
                y={lp.y + 9}
                textAnchor={anchor}
                fontSize="13"
                fontWeight="700"
                fill={v > 0 ? "#C4714A" : "#1a1504"}
                fontFamily="var(--font-geist-mono), monospace"
              >
                {v > 0 ? v.toFixed(1) : "—"}
              </text>
            </motion.g>
          );
        })}

        {/* ── Center dot ── */}
        <motion.circle
          cx={CX} cy={CY} r={3.5}
          fill="#C4714A"
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
        />
      </svg>
    </div>
  );
}
