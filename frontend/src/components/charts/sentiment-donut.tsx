"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface SentimentDonutProps {
  positive: number;
  negative: number;
  neutral: number;
}

const COLORS = { Positive: "#22c55e", Neutral: "#9ca3af", Negative: "#ef4444" };

export function SentimentDonut({ positive, negative, neutral }: SentimentDonutProps) {
  const isMobile = useIsMobile();
  const total = positive + negative + neutral;
  if (total === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No sentiment data</p>;
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
            stroke="#fff"
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
          />
          <Legend
            verticalAlign="bottom"
            layout={isMobile ? "vertical" : "horizontal"}
            align={isMobile ? "center" : "center"}
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              return `${value}: ${item?.value ?? 0} (${Math.round(((item?.value ?? 0) / total) * 100)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-2">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-sm text-muted-foreground ml-1">total reviews</span>
      </div>
    </div>
  );
}
