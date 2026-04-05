"use client";

import { useAnimatedCounter } from "@/hooks/use-animated-counter";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
  duration?: number;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  className = "",
  decimals = 0,
  duration = 800,
}: AnimatedCounterProps) {
  const { value: displayed, ref } = useAnimatedCounter(value, duration);

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className={`font-data tabular-nums ${className}`}
    >
      {prefix}
      {decimals > 0 ? displayed.toFixed(decimals) : displayed}
      {suffix}
    </span>
  );
}
