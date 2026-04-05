"use client";

import { useEffect, useRef, useState } from "react";

interface RatingGaugeProps {
  rating: number;
  maxRating?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

function ratingColor(rating: number): string {
  if (rating >= 4.0) return "text-[#4A7C59]";
  if (rating >= 3.5) return "text-terracotta";
  if (rating >= 3.0) return "text-[#C4714A]";
  if (rating >= 2.0) return "text-[#B05252]";
  return "text-[#8B3A3A]";
}

function ringColorHex(rating: number): string {
  if (rating >= 4.0) return "#4A7C59";
  if (rating >= 3.5) return "#C4714A";
  if (rating >= 3.0) return "#C4714A";
  if (rating >= 2.0) return "#B05252";
  return "#8B3A3A";
}

const SIZES = {
  sm: { outer: 80, stroke: 6, fontSize: "text-lg" },
  md: { outer: 120, stroke: 8, fontSize: "text-3xl" },
  lg: { outer: 160, stroke: 10, fontSize: "text-4xl" },
};

export function RatingGauge({ rating, maxRating = 5, label, size = "md" }: RatingGaugeProps) {
  const { outer, stroke, fontSize } = SIZES[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetProgress = (rating / maxRating) * circumference;

  const ref = useRef<SVGCircleElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animated]);

  const dashOffset = animated ? circumference - targetProgress : circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg width={outer} height={outer} className="-rotate-90">
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="rgba(26,21,4,0.08)"
            strokeWidth={stroke}
          />
          <circle
            ref={ref}
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            stroke={ringColorHex(rating)}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold font-mono ${ratingColor(rating)}`}>
            {rating.toFixed(1)}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-warmgray font-sans">{label}</span>}
    </div>
  );
}
