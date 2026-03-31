"use client";

interface RatingGaugeProps {
  rating: number;
  maxRating?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

function ratingColor(rating: number): string {
  if (rating >= 4.0) return "text-green-600";
  if (rating >= 3.5) return "text-blue-600";
  if (rating >= 3.0) return "text-yellow-600";
  if (rating >= 2.0) return "text-orange-500";
  return "text-red-500";
}

function ringColor(rating: number): string {
  if (rating >= 4.0) return "stroke-green-500";
  if (rating >= 3.5) return "stroke-blue-500";
  if (rating >= 3.0) return "stroke-yellow-500";
  if (rating >= 2.0) return "stroke-orange-500";
  return "stroke-red-500";
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
  const progress = (rating / maxRating) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg width={outer} height={outer} className="-rotate-90">
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-100"
          />
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className={ringColor(rating)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold ${ratingColor(rating)}`}>
            {rating.toFixed(1)}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
