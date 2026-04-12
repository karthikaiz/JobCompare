import { NextResponse } from "next/server";
import { INDUSTRY_STANDARDS } from "@/lib/industry-standards-source";

export interface IndustryAverages {
  [industry: string]: number;
}

/**
 * Returns research-backed industry standard ratings.
 * Not calculated from DB data — uses external benchmarks.
 */
export async function GET() {
  const result: IndustryAverages = {};

  // Return all mapped industry standards
  for (const [industry, data] of Object.entries(INDUSTRY_STANDARDS)) {
    if (industry !== "default") {
      result[industry] = data.standard;
    }
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
