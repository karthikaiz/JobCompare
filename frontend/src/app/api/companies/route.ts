import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const industry = request.nextUrl.searchParams.get("industry")?.trim() || "";
  const limit = Math.max(1, Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20") || 20, 50));
  const offset = Math.max(0, parseInt(request.nextUrl.searchParams.get("offset") || "0") || 0);

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { slug: { contains: q.toLowerCase() } },
      { industry: { contains: q } },
    ];
  }

  if (industry) {
    where.industry = { contains: industry };
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        industry: true,
        headquarters: true,
        overallRating: true,
        employeeCount: true,
        source: true,
        lastScrapedAt: true,
        _count: {
          select: {
            reviews: true,
            salaries: true,
            benefits: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json({
    companies,
    total,
    limit,
    offset,
  });
}
