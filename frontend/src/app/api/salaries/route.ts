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
    const { slug, role, location, baseSalary, totalComp, experience } = body;

    if (!slug || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }

    if (!role || typeof role !== "string" || !role.trim()) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (typeof baseSalary !== "number" || baseSalary <= 0 || baseSalary > 100000000) {
      return NextResponse.json({ error: "Invalid base salary" }, { status: 400 });
    }

    if (totalComp != null && (typeof totalComp !== "number" || totalComp < 0 || totalComp > 100000000)) {
      return NextResponse.json({ error: "Invalid total compensation" }, { status: 400 });
    }

    // Validate experience against allowed values
    const VALID_EXPERIENCE = ["0-1 years", "1-3 years", "3-5 years", "5-8 years", "8-12 years", "12-15 years", "15+ years"];
    if (experience != null && !VALID_EXPERIENCE.includes(String(experience))) {
      return NextResponse.json({ error: "Invalid experience range" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Transaction prevents race condition
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const submission = await prisma.$transaction(async (tx) => {
      const recentSubmission = await tx.userSalarySubmission.findFirst({
        where: {
          userId: user.userId,
          companyId: company.id,
          createdAt: { gte: oneWeekAgo },
        },
      });
      if (recentSubmission) {
        throw new Error("RATE_LIMITED");
      }

      return tx.userSalarySubmission.create({
        data: {
          userId: user.userId,
          companyId: company.id,
          role: String(role).trim().slice(0, 100),
          location: location ? String(location).trim().slice(0, 100) : null,
          baseSalary: Math.round(baseSalary),
          totalComp: totalComp != null ? Math.round(totalComp) : null,
          experience: experience ? String(experience).trim().slice(0, 50) : null,
        },
      });
    });

    return NextResponse.json({ submission: { id: submission.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "RATE_LIMITED") {
      return NextResponse.json({ error: "You already submitted salary data for this company this week" }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to submit salary data" }, { status: 500 });
  }
}
