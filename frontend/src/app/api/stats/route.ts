import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [companies, reviews, salaries] = await Promise.all([
    prisma.company.count(),
    prisma.review.count(),
    prisma.salary.count(),
  ]);

  return NextResponse.json(
    { companies, reviews, salaries, industries: 13 },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
