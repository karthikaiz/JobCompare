import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,200}$/;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug, title, role, location, overallRating,
      workLifeBalanceRating, salaryRating, jobSecurityRating,
      careerGrowthRating, companyCultureRating, pros, cons,
      isAnonymous, isCurrentEmployee,
    } = body;

    if (!slug || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    if (!title || !role || !pros || !cons) {
      return NextResponse.json({ error: "Title, role, pros, and cons are required" }, { status: 400 });
    }

    if (typeof overallRating !== "number" || overallRating < 1 || overallRating > 5) {
      return NextResponse.json({ error: "Overall rating must be between 1 and 5" }, { status: 400 });
    }

    const optionalRatings = { workLifeBalanceRating, salaryRating, jobSecurityRating, careerGrowthRating, companyCultureRating };
    for (const [key, val] of Object.entries(optionalRatings)) {
      if (val != null && (typeof val !== "number" || val < 1 || val > 5)) {
        return NextResponse.json({ error: `${key} must be between 1 and 5` }, { status: 400 });
      }
    }

    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Transaction prevents race condition: check + create are atomic
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const review = await prisma.$transaction(async (tx) => {
      const recentReview = await tx.userReview.findFirst({
        where: {
          userId: user.userId,
          companyId: company.id,
          createdAt: { gte: oneDayAgo },
        },
      });
      if (recentReview) {
        throw new Error("RATE_LIMITED");
      }

      return tx.userReview.create({
        data: {
          userId: user.userId,
          companyId: company.id,
          title: String(title).trim().slice(0, 200),
          role: String(role).trim().slice(0, 100),
          location: location ? String(location).trim().slice(0, 100) : null,
          overallRating: Math.round(overallRating * 10) / 10,
          workLifeBalanceRating: workLifeBalanceRating != null ? Math.round(workLifeBalanceRating * 10) / 10 : null,
          salaryRating: salaryRating != null ? Math.round(salaryRating * 10) / 10 : null,
          jobSecurityRating: jobSecurityRating != null ? Math.round(jobSecurityRating * 10) / 10 : null,
          careerGrowthRating: careerGrowthRating != null ? Math.round(careerGrowthRating * 10) / 10 : null,
          companyCultureRating: companyCultureRating != null ? Math.round(companyCultureRating * 10) / 10 : null,
          pros: String(pros).trim().slice(0, 2000),
          cons: String(cons).trim().slice(0, 2000),
          isAnonymous: isAnonymous !== false,
          isCurrentEmployee: isCurrentEmployee === true,
        },
      });
    });

    return NextResponse.json({ review: { id: review.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "RATE_LIMITED") {
      return NextResponse.json({ error: "You already submitted a review for this company in the last 24 hours" }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
