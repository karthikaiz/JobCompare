import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeCompany } from "@/lib/scraper-client";

const SYNC_API_KEY = process.env.SYNC_API_KEY || "jobcompare-dev-key";

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

    // Sync to our own /api/sync endpoint internally
    const syncPayload = {
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
      source: "ambitionbox",
      reviews: scraped.reviews.map((r) => ({
        title: r.title,
        role: r.role,
        location: r.location,
        rating: r.rating,
        pros: r.pros,
        cons: r.cons,
        isCurrentEmployee: r.is_current_employee,
        reviewDate: r.review_date,
      })),
      salaries: scraped.salaries.map((s) => ({
        role: s.role,
        location: s.location,
        minSalary: s.min_salary,
        maxSalary: s.max_salary,
        avgSalary: s.avg_salary,
        currency: s.currency || "INR",
        experience: s.experience,
        sampleCount: s.sample_count,
      })),
      benefits: scraped.benefits.map((b) => ({
        category: b.category,
        name: b.name,
        details: b.details,
      })),
    };

    // Call our own sync endpoint
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const syncRes = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SYNC_API_KEY,
      },
      body: JSON.stringify(syncPayload),
    });

    const syncResult = await syncRes.json();

    return NextResponse.json({
      success: true,
      company: slug,
      ...syncResult,
    });
  } catch (error) {
    console.error(`Refresh error for ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to refresh company data" },
      { status: 500 }
    );
  }
}
