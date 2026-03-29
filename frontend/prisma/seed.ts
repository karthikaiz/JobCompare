import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface SeedReview {
  title: string | null;
  role: string | null;
  location: string | null;
  rating: number | null;
  pros: string;
  cons: string;
  sentiment: string | null;
  sentiment_score: number | null;
  is_current_employee: boolean | null;
  review_date: string | null;
}

interface SeedSalary {
  role: string;
  location: string | null;
  min_salary: number;
  max_salary: number;
  avg_salary: number | null;
  currency: string;
  experience: string | null;
  sample_count: number | null;
}

interface SeedBenefit {
  category: string;
  name: string;
  details: string | null;
}

interface SeedCompany {
  slug: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  headquarters: string | null;
  employee_count: string | null;
  founded: number | null;
  website: string | null;
  overall_rating: number | null;
  work_life_balance: number | null;
  salary_benefits: number | null;
  job_security: number | null;
  career_growth: number | null;
  company_culture: number | null;
  reviews: SeedReview[];
  salaries: SeedSalary[];
  benefits: SeedBenefit[];
}

async function main() {
  const seedPath = path.join(__dirname, "..", "..", "scraper", "data", "seed_companies.json");

  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found at: ${seedPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(seedPath, "utf-8");
  const companies: SeedCompany[] = JSON.parse(rawData);

  console.log(`Seeding ${companies.length} companies...`);

  // Clear existing data
  await prisma.userSalarySubmission.deleteMany();
  await prisma.userReview.deleteMany();
  await prisma.sentimentSnapshot.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.review.deleteMany();
  await prisma.company.deleteMany();

  for (const company of companies) {
    const created = await prisma.company.create({
      data: {
        slug: company.slug,
        name: company.name,
        logoUrl: company.logo_url,
        industry: company.industry,
        headquarters: company.headquarters,
        employeeCount: company.employee_count,
        founded: company.founded,
        website: company.website,
        overallRating: company.overall_rating,
        workLifeBalance: company.work_life_balance,
        salaryBenefits: company.salary_benefits,
        jobSecurity: company.job_security,
        careerGrowth: company.career_growth,
        companyCulture: company.company_culture,
        source: "seed",
        lastScrapedAt: new Date(),
        reviews: {
          create: company.reviews.map((r) => ({
            title: r.title,
            role: r.role,
            location: r.location,
            rating: r.rating,
            pros: r.pros,
            cons: r.cons,
            sentiment: r.sentiment,
            sentimentScore: r.sentiment_score,
            isCurrentEmployee: r.is_current_employee,
            reviewDate: r.review_date ? new Date(r.review_date) : null,
          })),
        },
        salaries: {
          create: company.salaries.map((s) => ({
            role: s.role,
            location: s.location,
            minSalary: s.min_salary,
            maxSalary: s.max_salary,
            avgSalary: s.avg_salary,
            currency: s.currency,
            experience: s.experience,
            sampleCount: s.sample_count,
          })),
        },
        benefits: {
          create: company.benefits.map((b) => ({
            category: b.category,
            name: b.name,
            details: b.details,
          })),
        },
        sentimentData: {
          create: {
            positiveCount: company.reviews.filter((r) => r.sentiment === "positive").length,
            negativeCount: company.reviews.filter((r) => r.sentiment === "negative").length,
            neutralCount: company.reviews.filter((r) => r.sentiment === "neutral").length,
            topPositiveThemes: JSON.stringify(["work-life balance", "career growth", "benefits"]),
            topNegativeThemes: JSON.stringify(["management", "salary & compensation", "job security"]),
            analyzedAt: new Date(),
          },
        },
      },
    });

    console.log(`  Seeded: ${created.name} (${company.reviews.length} reviews, ${company.salaries.length} salaries, ${company.benefits.length} benefits)`);
  }

  console.log(`\nDone! Seeded ${companies.length} companies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
