const SCRAPER_URL = process.env.SCRAPER_SERVICE_URL;
if (!SCRAPER_URL) {
  console.warn("WARNING: SCRAPER_SERVICE_URL not set");
}

interface ScraperCompanyData {
  slug: string;
  name: string;
  logo_url?: string;
  industry?: string;
  headquarters?: string;
  employee_count?: string;
  founded?: number;
  website?: string;
  overall_rating?: number;
  work_life_balance?: number;
  salary_benefits?: number;
  job_security?: number;
  career_growth?: number;
  company_culture?: number;
  reviews: Array<{
    title?: string;
    role?: string;
    location?: string;
    rating?: number;
    pros: string;
    cons: string;
    is_current_employee?: boolean;
    review_date?: string;
  }>;
  salaries: Array<{
    role: string;
    location?: string;
    min_salary: number;
    max_salary: number;
    avg_salary?: number;
    currency?: string;
    experience?: string;
    sample_count?: number;
  }>;
  benefits: Array<{
    category: string;
    name: string;
    details?: string;
  }>;
}

export async function scrapeCompany(slug: string): Promise<ScraperCompanyData> {
  const res = await fetch(`${SCRAPER_URL}/scrape/ambitionbox/${slug}`, {
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    throw new Error(`Scraper returned ${res.status}`);
  }

  return res.json();
}
