"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface BenefitsRadarProps {
  workLifeBalance: number | null;
  salaryBenefits: number | null;
  jobSecurity: number | null;
  careerGrowth: number | null;
  companyCulture: number | null;
}

export function BenefitsRadar({
  workLifeBalance,
  salaryBenefits,
  jobSecurity,
  careerGrowth,
  companyCulture,
}: BenefitsRadarProps) {
  const isMobile = useIsMobile();

  const data = [
    { axis: isMobile ? "Work-Life" : "Work-Life Balance", value: workLifeBalance ?? 0 },
    { axis: isMobile ? "Salary" : "Salary & Benefits", value: salaryBenefits ?? 0 },
    { axis: isMobile ? "Security" : "Job Security", value: jobSecurity ?? 0 },
    { axis: isMobile ? "Growth" : "Career Growth", value: careerGrowth ?? 0 },
    { axis: "Culture", value: companyCulture ?? 0 },
  ];

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "70%"}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: "#6b7280", fontSize: isMobile ? 10 : 11 }}
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tickCount={6}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
        />
        <Radar
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
