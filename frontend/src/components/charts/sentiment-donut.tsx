"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface SentimentDonutProps {
  positive: number;
  negative: number;
  neutral: number;
}

const COLORS = { Positive: "#4A7C59", Neutral: "#C4B99A", Negative: "#B05252" };

const TOOLTIP_STYLE = {
  backgroundColor: "#FDFCF5",
  border: "1px solid rgba(26,21,4,0.12)",
  borderRadius: "4px",
  color: "#1a1504",
};

export function SentimentDonut({ positive, negative, neutral }: SentimentDonutProps) {
  const isMobile = useIsMobile();
  const total = positive + negative + neutral;
  if (total === 0) {
    return <p className="text-sm text-warmgray text-center py-8 font-sans">No sentiment data</p>;
  }

  const data = [
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isMobile ? 40 : 55}
            outerRadius={isMobile ? 70 : 90}
            dataKey="value"
            strokeWidth={2}
            stroke="#FDFCF5"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} (${Math.round((Number(value) / total) * 100)}%)`,
              String(name),
            ]}
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: "#6b6559" }}
          />
          <Legend
            verticalAlign="bottom"
            layout={isMobile ? "vertical" : "horizontal"}
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              return (
                <span style={{ color: "#6b6559", fontFamily: "var(--font-geist-sans)", fontSize: "11px" }}>
                  {`${value}: ${item?.value ?? 0} (${Math.round(((item?.value ?? 0) / total) * 100)}%)`}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-2">
        <span className="text-2xl font-bold font-mono text-ink">{total}</span>
        <span className="text-sm text-warmgray ml-1 font-sans">total reviews</span>
      </div>
    </div>
  );
}
