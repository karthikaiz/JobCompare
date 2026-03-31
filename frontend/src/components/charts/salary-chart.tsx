"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface Salary {
  role: string;
  minSalary: number;
  maxSalary: number;
  avgSalary: number | null;
  currency: string;
}

interface SalaryChartProps {
  salaries: Salary[];
}

function formatLakhs(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#f43f5e", "#f97316", "#eab308",
];

export function SalaryChart({ salaries }: SalaryChartProps) {
  const isMobile = useIsMobile();

  if (salaries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No salary data available</p>;
  }

  const maxRoleLen = isMobile ? 15 : 25;
  const data = salaries
    .slice(0, 10)
    .map((s) => ({
      role: s.role.length > maxRoleLen ? s.role.slice(0, maxRoleLen - 3) + "..." : s.role,
      fullRole: s.role,
      min: s.minSalary,
      avg: s.avgSalary ?? Math.round((s.minSalary + s.maxSalary) / 2),
      max: s.maxSalary,
    }));

  const yAxisWidth = isMobile ? 80 : 140;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 45 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
        <XAxis
          type="number"
          tickFormatter={formatLakhs}
          tick={{ fontSize: isMobile ? 10 : 11, fill: "#6b7280" }}
        />
        <YAxis
          type="category"
          dataKey="role"
          width={yAxisWidth}
          tick={{ fontSize: isMobile ? 10 : 11, fill: "#374151" }}
        />
        <Tooltip
          formatter={(value) => [`${formatLakhs(Number(value))}/yr`, ""]}
          labelFormatter={(label) => {
            const item = data.find((d) => d.role === String(label));
            return item?.fullRole || String(label);
          }}
        />
        <Bar dataKey="avg" name="Avg Salary" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
