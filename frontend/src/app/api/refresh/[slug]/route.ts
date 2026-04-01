import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeCompany } from "@/lib/scraper-client";
import { classifySentiment } from "@/lib/sentiment";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!/^[a-z0-9][a-z0-9-]{0,200}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  // Check if company exists in DB
  const existing = await prisma.company.findUnique({
    where: { slug },
    select: { lastScrapedAt: true },
  });

  // Rate limit: don't re-scrape within 1 hour
  if (existing?.lastScrapedAt) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (existing.lastScrapedAt > hourAgo) {
      return NextResponse.json({
        message: "Company was recently scraped",
        lastScrapedAt: existing.lastScrapedAt,
      });
    }
  }

  try {
    // Trigger scrape via Python service
    const scraped = await scrapeCompany(slug);

    // Sync directly to DB (no internal HTTP call needed)
    const company = await prisma.company.upsert({
      where: { slug },
      create: {
        slug: scraped.slug,
        name: scraped.name,
        logoUrl: scraped.logo_url,
        industry: scraped.industry,
        headquarters: scraped.headquarters,
        employeeCount: scraped.employee_count,
        founded: scraped.founded,
        website: scraped.website,
        overallRating: scraped.overall_rating,
        workLifeBalance: scraped.work_life_balance,
        salaryBenefits: scraped.salary_benefits,
        jobSecurity: scraped.job_security,
        careerGrowth: scraped.career_growth,
        companyCulture: scraped.company_culture,
        source: "scraped",
        lastScrapedAt: new Date(),
      },
      update: {
        name: scraped.name,
        logoUrl: scraped.logo_url,
        industry: scraped.industry,
        headquarters: scraped.headquarters,
        employeeCount: scraped.employee_count,
        founded: scraped.founded,
        website: scraped.website,
        overallRating: scraped.overall_rating,
        workLifeBalance: scraped.work_life_balance,
        salaryBenefits: scraped.salary_benefits,
        jobSecurity: scraped.job_security,
        careerGrowth: scraped.career_growth,
        companyCulture: scraped.company_culture,
        source: "scraped",
        lastScrapedAt: new Date(),
      },
    });

    // Replace salaries
    await prisma.salary.deleteMany({ where: { companyId: company.id } });
    for (const s of scraped.salaries) {
      await prisma.salary.create({
        data: {
          companyId: company.id,
          role: s.role,
          location: s.location,
          minSalary: s.min_salary,
          maxSalary: s.max_salary,
          avgSalary: s.avg_salary,
          currency: s.currency || "INR",
          experience: s.experience,
          sampleCount: s.sample_count,
        },
      });
    }

    // Replace benefits
    await prisma.benefit.deleteMany({ where: { companyId: company.id } });
    for (const b of scraped.benefits) {
      await prisma.benefit.create({
        data: {
          companyId: company.id,
          category: b.category,
          name: b.name,
          details: b.details,
        },
      });
    }

    // Add new reviews (deduplicate)
    const existingReviews = await prisma.review.findMany({
      where: { companyId: company.id },
      select: { title: true, role: true, pros: true },
    });
    const existingHashes = new Set(
      existingReviews.map((r) => `${r.title || ""}|${r.role || ""}|${r.pros.slice(0, 50)}`)
    );

    let newReviews = 0;
    let posCount = 0, negCount = 0, neuCount = 0;
    for (const r of scraped.reviews) {
      const hash = `${r.title || ""}|${r.role || ""}|${r.pros.slice(0, 50)}`;
      if (existingHashes.has(hash)) continue;

      const { sentiment, score } = classifySentiment(r.rating, r.pros, r.cons);
      if (sentiment === "positive") posCount++;
      else if (sentiment === "negative") negCount++;
      else neuCount++;

      await prisma.review.create({
        data: {
          companyId: company.id,
          title: r.title,
          role: r.role,
          location: r.location,
          rating: r.rating,
          pros: r.pros,
          cons: r.cons,
          sentiment,
          sentimentScore: score,
          isCurrentEmployee: r.is_current_employee,
          reviewDate: r.review_date ? new Date(r.review_date) : null,
        },
      });
      newReviews++;
    }

    // Create sentiment snapshot
    if (newReviews > 0) {
      await prisma.sentimentSnapshot.create({
        data: {
          companyId: company.id,
          positiveCount: posCount,
          negativeCount: negCount,
          neutralCount: neuCount,
          topPositiveThemes: "[]",
          topNegativeThemes: "[]",
        },
      });
    }

    return NextResponse.json({
      success: true,
      company: slug,
      newReviews,
      salaries: scraped.salaries.length,
      benefits: scraped.benefits.length,
    });
  } catch (error) {
    console.error(`Refresh error for ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to refresh company data" },
      { status: 500 }
    );
  }
}
