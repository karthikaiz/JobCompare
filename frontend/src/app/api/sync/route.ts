import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifySentiment } from "@/lib/sentiment";

const SYNC_API_KEY = process.env.SYNC_API_KEY;
if (!SYNC_API_KEY) {
  console.warn("WARNING: SYNC_API_KEY not set — sync endpoint will reject all requests");
}
const MAX_REVIEWS = 500;
const MAX_SALARIES = 100;
const MAX_BENEFITS = 100;
const MAX_STRING_LENGTH = 10000;

function truncate(s: string | undefined | null, max: number = MAX_STRING_LENGTH): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

/** Clamp a rating to 0-5 range, return null if not a valid number */
function clampRating(v: unknown): number | null {
  if (v == null || typeof v !== "number" || isNaN(v)) return null;
  return Math.round(Math.max(0, Math.min(5, v)) * 100) / 100;
}

interface ReviewInput {
  title?: string;
  role?: string;
  location?: string;
  rating?: number;
  pros: string;
  cons: string;
  sentiment?: string;
  sentimentScore?: number;
  isCurrentEmployee?: boolean;
  reviewDate?: string;
}

interface SalaryInput {
  role: string;
  location?: string;
  minSalary: number;
  maxSalary: number;
  avgSalary?: number;
  currency?: string;
  experience?: string;
  sampleCount?: number;
}

interface BenefitInput {
  category: string;
  name: string;
  details?: string;
}

interface SentimentInput {
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topPositiveThemes: string[];
  topNegativeThemes: string[];
}

interface SyncPayload {
  slug: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  headquarters?: string;
  employeeCount?: string;
  founded?: number;
  website?: string;
  overallRating?: number;
  workLifeBalance?: number;
  salaryBenefits?: number;
  jobSecurity?: number;
  careerGrowth?: number;
  companyCulture?: number;
  reviews: ReviewInput[];
  salaries: SalaryInput[];
  benefits: BenefitInput[];
  sentiment?: SentimentInput;
  source?: string;
}

function reviewHash(r: ReviewInput): string {
  return `${r.title || ""}|${r.role || ""}|${r.reviewDate || ""}|${r.pros.slice(0, 50)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== SYNC_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SyncPayload = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9][a-z0-9-]{0,200}$/.test(slug)) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
    }

    // Enforce size limits
    if (body.reviews && body.reviews.length > MAX_REVIEWS) {
      body.reviews = body.reviews.slice(0, MAX_REVIEWS);
    }
    if (body.salaries && body.salaries.length > MAX_SALARIES) {
      body.salaries = body.salaries.slice(0, MAX_SALARIES);
    }
    if (body.benefits && body.benefits.length > MAX_BENEFITS) {
      body.benefits = body.benefits.slice(0, MAX_BENEFITS);
    }

    // Upsert company (truncate all string fields)
    const company = await prisma.company.upsert({
      where: { slug },
      create: {
        slug,
        name: truncate(body.name, 500),
        logoUrl: truncate(body.logoUrl, 2000),
        industry: truncate(body.industry, 200),
        headquarters: truncate(body.headquarters, 500),
        employeeCount: truncate(body.employeeCount, 100),
        founded: body.founded,
        website: truncate(body.website, 2000),
        overallRating: clampRating(body.overallRating),
        workLifeBalance: clampRating(body.workLifeBalance),
        salaryBenefits: clampRating(body.salaryBenefits),
        jobSecurity: clampRating(body.jobSecurity),
        careerGrowth: clampRating(body.careerGrowth),
        companyCulture: clampRating(body.companyCulture),
        source: truncate(body.source, 50) || "ambitionbox",
        lastScrapedAt: new Date(),
      },
      update: {
        name: truncate(body.name, 500),
        logoUrl: truncate(body.logoUrl, 2000),
        industry: truncate(body.industry, 200),
        headquarters: truncate(body.headquarters, 500),
        employeeCount: truncate(body.employeeCount, 100),
        founded: body.founded,
        website: truncate(body.website, 2000),
        overallRating: clampRating(body.overallRating),
        workLifeBalance: clampRating(body.workLifeBalance),
        salaryBenefits: clampRating(body.salaryBenefits),
        jobSecurity: clampRating(body.jobSecurity),
        careerGrowth: clampRating(body.careerGrowth),
        companyCulture: clampRating(body.companyCulture),
        source: truncate(body.source, 50) || "ambitionbox",
        lastScrapedAt: new Date(),
      },
    });

    // Get existing review hashes for deduplication
    const existingReviews = await prisma.review.findMany({
      where: { companyId: company.id },
      select: { title: true, role: true, reviewDate: true, pros: true },
    });
    const existingHashes = new Set(
      existingReviews.map((r) =>
        `${r.title || ""}|${r.role || ""}|${r.reviewDate?.toISOString().split("T")[0] || ""}|${r.pros.slice(0, 50)}`
      )
    );

    // Insert new reviews (skip duplicates)
    let newReviews = 0;
    for (const review of body.reviews) {
      const hash = reviewHash(review);
      if (existingHashes.has(hash)) continue;

      // Use provided sentiment or classify from rating/text
      let sentiment = review.sentiment;
      let sentimentScore = review.sentimentScore;
      if (!sentiment) {
        const classified = classifySentiment(review.rating, review.pros, review.cons);
        sentiment = classified.sentiment;
        sentimentScore = classified.score;
      }

      await prisma.review.create({
        data: {
          companyId: company.id,
          title: truncate(review.title, 500),
          role: truncate(review.role, 300),
          location: truncate(review.location, 300),
          rating: review.rating,
          pros: truncate(review.pros),
          cons: truncate(review.cons),
          sentiment: truncate(sentiment, 20),
          sentimentScore: sentimentScore,
          isCurrentEmployee: review.isCurrentEmployee,
          reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
        },
      });
      newReviews++;
    }

    // Replace salaries (always update with latest data)
    await prisma.salary.deleteMany({ where: { companyId: company.id } });
    let salaryCount = 0;
    for (const salary of body.salaries) {
      await prisma.salary.create({
        data: {
          companyId: company.id,
          role: truncate(salary.role, 300),
          location: truncate(salary.location, 300),
          minSalary: salary.minSalary,
          maxSalary: salary.maxSalary,
          avgSalary: salary.avgSalary,
          currency: truncate(salary.currency, 10) || "INR",
          experience: truncate(salary.experience, 100),
          sampleCount: salary.sampleCount,
        },
      });
      salaryCount++;
    }

    // Replace benefits (always update with latest data)
    await prisma.benefit.deleteMany({ where: { companyId: company.id } });
    let benefitCount = 0;
    for (const benefit of body.benefits) {
      await prisma.benefit.create({
        data: {
          companyId: company.id,
          category: truncate(benefit.category, 200),
          name: truncate(benefit.name, 500),
          details: truncate(benefit.details, 2000),
        },
      });
      benefitCount++;
    }

    // Create sentiment snapshot if provided
    if (body.sentiment) {
      await prisma.sentimentSnapshot.create({
        data: {
          companyId: company.id,
          positiveCount: body.sentiment.positiveCount,
          negativeCount: body.sentiment.negativeCount,
          neutralCount: body.sentiment.neutralCount,
          topPositiveThemes: JSON.stringify(body.sentiment.topPositiveThemes),
          topNegativeThemes: JSON.stringify(body.sentiment.topNegativeThemes),
        },
      });
    }

    return NextResponse.json({
      success: true,
      company: slug,
      newReviews,
      skippedReviews: body.reviews.length - newReviews,
      salaries: salaryCount,
      benefits: benefitCount,
      hasSentiment: !!body.sentiment,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
