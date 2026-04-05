"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ThemeBarChartProps {
  themes: string[];
  reviews: Array<{ pros: string; cons: string; sentiment: string | null }>;
  type: "positive" | "negative";
}

const THEME_KEYWORDS: Record<string, string[]> = {
  "work-life balance": ["work life balance", "work-life balance", "wlb", "working hours", "overtime", "flexible hours", "long hours"],
  "salary & compensation": ["salary", "compensation", "pay", "hike", "increment", "ctc", "package", "bonus", "low pay"],
  "management": ["management", "manager", "leadership", "lead", "supervisor", "boss"],
  "career growth": ["growth", "promotion", "career", "learning", "opportunity", "appraisal"],
  "company culture": ["culture", "environment", "diversity", "politics", "bureaucracy", "hierarchy"],
  "job security": ["job security", "layoff", "termination", "firing", "restructuring", "bench"],
  "benefits": ["insurance", "health", "medical", "leave", "pf", "perks", "food", "cab"],
  "technology": ["technology", "tech stack", "modern", "legacy", "outdated", "innovation"],
  "training": ["training", "learning", "certification", "upskilling", "course"],
  "onsite": ["onsite", "on-site", "abroad", "international", "travel"],
};

function countThemes(reviews: ThemeBarChartProps["reviews"], type: "positive" | "negative"): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const review of reviews) {
    const text = type === "positive" ? review.pros : review.cons;
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          counts[theme] = (counts[theme] || 0) + 1;
          break;
        }
      }
    }
  }
  return counts;
}

const POS_COLORS = ["#4A7C59", "#5C8A5C", "#6B9E6B", "#3D6B4A", "#7AAF7A"];
const NEG_COLORS = ["#B05252", "#C46262", "#A04040", "#CC7070", "#8B3A3A"];

const TOOLTIP_STYLE = {
  backgroundColor: "#FDFCF5",
  border: "1px solid rgba(26,21,4,0.12)",
  borderRadius: "4px",
  color: "#1a1504",
};

export function ThemeBarChart({ themes, reviews, type }: ThemeBarChartProps) {
  const isMobile = useIsMobile();

  let data: Array<{ theme: string; count: number }>;

  if (themes.length > 0) {
    const counts = countThemes(reviews, type);
    data = themes.map((t) => ({ theme: t, count: counts[t] || 0 }));
  } else {
    const counts = countThemes(reviews, type);
    data = Object.entries(counts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  if (data.length === 0) {
    return <p className="text-sm text-warmgray text-center py-6 font-sans">No theme data available</p>;
  }

  const colors = type === "positive" ? POS_COLORS : NEG_COLORS;

  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * 40 + 20)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11, fill: "#6b6559" }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="theme"
          width={isMobile ? 75 : 130}
          tick={{ fontSize: isMobile ? 9 : 11, fill: "#1a1504" }}
        />
        <Tooltip
          formatter={(value) => [`${value} mentions`, ""]}
          contentStyle={TOOLTIP_STYLE}
          itemStyle={{ color: "#6b6559" }}
          labelStyle={{ color: "#C4714A", fontWeight: 600 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
