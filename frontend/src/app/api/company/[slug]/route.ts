import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!/^[a-z0-9][a-z0-9-]{0,200}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      reviews: {
        orderBy: { reviewDate: "desc" },
        take: 100,
      },
      salaries: {
        orderBy: { avgSalary: "desc" },
      },
      benefits: true,
      sentimentData: {
        orderBy: { analyzedAt: "desc" },
        take: 1,
      },
      userReviews: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: { select: { displayName: true } },
        },
      },
      userSalaries: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Parse sentiment themes from JSON strings
  const latestSentiment = company.sentimentData[0];
  const sentiment = latestSentiment
    ? {
        positiveCount: latestSentiment.positiveCount,
        negativeCount: latestSentiment.negativeCount,
        neutralCount: latestSentiment.neutralCount,
        topPositiveThemes: JSON.parse(latestSentiment.topPositiveThemes),
        topNegativeThemes: JSON.parse(latestSentiment.topNegativeThemes),
        analyzedAt: latestSentiment.analyzedAt,
      }
    : null;

  // Round float ratings to avoid precision artifacts (e.g. 3.900000095367432 → 3.9)
  const round = (v: number | null) => (v != null ? Math.round(v * 100) / 100 : v);

  return NextResponse.json({
    ...company,
    overallRating: round(company.overallRating),
    workLifeBalance: round(company.workLifeBalance),
    salaryBenefits: round(company.salaryBenefits),
    jobSecurity: round(company.jobSecurity),
    careerGrowth: round(company.careerGrowth),
    companyCulture: round(company.companyCulture),
    sentimentData: undefined,
    sentiment,
  });
}
