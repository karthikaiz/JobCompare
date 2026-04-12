/**
 * Industry Standards — Research-Backed Benchmarks
 *
 * These standards are derived from third-party sources and used internally
 * to benchmark JobCompare companies. Sources are cited for traceability.
 * Industry keys MUST exactly match values in scraper/data/company_registry.json.
 *
 * Sources used:
 * - Glassdoor Industry Averages (2025-2026): https://help.glassdoor.com/s/article/Ratings-on-Glassdoor
 * - Glassdoor Best Places to Work 2025: https://www.glassdoor.com/about/press-release/glassdoor-reveals-best-places-to-work-2025-winners/
 * - Glassdoor Employer Branding Report: https://employerbrandingexp.com/blog/what-is-a-good-glassdoor-rating
 * - AmbitionBox Best Places to Work India 2022: https://allthingstalent.org/ambitionbox-best-places-to-work-in-india-2022-awards-winners-announced
 * - Collectiver Glassdoor Analysis: https://collectiver.com/blog/glassdoor-engagement-ratings/
 * - India-specific company data: TCS 3.3, Infosys 3.3, Wipro 3.1, Cognizant 3.5, Flipkart 3.9, Zomato 3.3 (Glassdoor India)
 *
 * Last Updated: 2026-04-11
 */

export interface IndustryStandard {
  standard: number; // 0-5 scale overall benchmark
  source: string;
  citation: string;
  year: number;
  notes: string;
}

export interface IndustryStandardMapping {
  [industry: string]: IndustryStandard;
}

/**
 * Industry benchmarks based on public third-party research.
 * Keys match exactly with industry values in company_registry.json
 */
export const INDUSTRY_STANDARDS: IndustryStandardMapping = {

  // ── Software & Technology ───────────────────────────────────────────────

  "IT Services": {
    standard: 3.5,
    source: "Glassdoor + AmbitionBox India",
    citation: "Glassdoor IT Industry avg 3.7 (global); Indian IT services adjusted based on TCS 3.3, Infosys 3.3, Wipro 3.1, Cognizant 3.5, HCL 3.1 (Glassdoor India 2025)",
    year: 2026,
    notes: "Large Indian IT services firms consistently rate 0.2–0.4 below global IT average due to scale, margins pressure, and bench culture",
  },

  "SaaS": {
    standard: 3.7,
    source: "Glassdoor",
    citation: "Glassdoor Information Technology / Software Products industry average 3.9 (global 2025); adjusted to 3.7 for Indian SaaS market",
    year: 2026,
    notes: "Indian SaaS (Zoho, Freshworks, Postman) tend to rate higher than IT services due to product culture and better WLB",
  },

  "Tech MNC": {
    standard: 3.9,
    source: "Glassdoor",
    citation: "Glassdoor global tech MNCs (Google, Microsoft, Adobe, Intel, Oracle) average 3.8–4.1 (2025); India offices slightly lower",
    year: 2026,
    notes: "Premium employers — Google India, Microsoft India consistently among highest-rated. Standard set conservatively at 3.9",
  },

  // ── Financial Services ──────────────────────────────────────────────────

  "Banking": {
    standard: 3.4,
    source: "Glassdoor",
    citation: "Glassdoor Financial Services industry average 3.7 (global 2025); adjusted to 3.4 for Indian banking sector",
    year: 2026,
    notes: "Indian private banks (HDFC, ICICI, Axis) and PSU banks (SBI, PNB) have mixed ratings; PSUs drag average lower",
  },

  "Fintech": {
    standard: 3.6,
    source: "Glassdoor",
    citation: "Glassdoor Fintech average 3.8 (global 2025); adjusted to 3.6 for Indian fintech startups (Razorpay, Paytm, PhonePe, CRED)",
    year: 2026,
    notes: "Fast-growth Indian fintech companies tend toward 3.4–3.8 range; competitive pay but high-pressure work culture",
  },

  "Insurance": {
    standard: 3.3,
    source: "Glassdoor",
    citation: "Glassdoor Finance & Insurance industry segment; Indian insurance companies (Bajaj Allianz, ICICI Lombard) typically 3.2–3.5",
    year: 2026,
    notes: "Insurance sector in India has high sales pressure and target-driven culture which suppresses ratings",
  },

  // ── Commerce & Consumer ─────────────────────────────────────────────────

  "E-Commerce": {
    standard: 3.5,
    source: "Glassdoor",
    citation: "Based on Indian e-commerce data: Flipkart 3.9, Snapdeal 3.3, Meesho 3.6, Amazon India 3.7 (Glassdoor India 2025)",
    year: 2026,
    notes: "Wide spread in Indian e-commerce ratings; large platforms like Flipkart/Amazon rate higher than smaller players",
  },

  "Food & Delivery": {
    standard: 3.4,
    source: "Glassdoor",
    citation: "Zomato 3.3, Swiggy 3.5 (Glassdoor India 2025); average benchmark set at 3.4",
    year: 2026,
    notes: "High-growth delivery platforms have high attrition and variable ratings; delivery ops drag scores down",
  },

  "FMCG": {
    standard: 3.6,
    source: "Glassdoor",
    citation: "Glassdoor Consumer Goods industry average 3.6–3.8 (global); Hindustan Unilever 3.8, ITC 3.5, Nestlé India 3.7 (Glassdoor India)",
    year: 2026,
    notes: "FMCG companies tend to have structured career paths and strong brand culture, resulting in above-average ratings",
  },

  "Retail": {
    standard: 3.2,
    source: "Glassdoor",
    citation: "Glassdoor Retail industry average 3.2–3.4 (global and India 2025); retail typically lower due to shift work and sales targets",
    year: 2026,
    notes: "Indian retail sector (Lenskart etc.) has mixed ratings; front-line retail lowers average despite corporate office scores",
  },

  // ── Conglomerates & Industry ────────────────────────────────────────────

  "Conglomerate": {
    standard: 3.5,
    source: "Glassdoor + AmbitionBox India",
    citation: "Tata Group 3.7, Reliance Industries 3.4, Mahindra 3.6 (Glassdoor India 2025); mid-point at 3.5",
    year: 2026,
    notes: "Indian conglomerates span many business units with variable ratings; Tata tends higher than average",
  },

  "Automotive": {
    standard: 3.4,
    source: "Glassdoor",
    citation: "Glassdoor Automotive industry average 3.3–3.5 (global); Maruti Suzuki 3.5, Tata Motors 3.3, Hero MotoCorp 3.4 (Glassdoor India)",
    year: 2026,
    notes: "Traditional automotive sector has structured but conservative culture; manufacturing ops and sales lowers ratings",
  },

  "Manufacturing": {
    standard: 3.3,
    source: "Glassdoor",
    citation: "Glassdoor Manufacturing & Energy industry average 3.3 (global 2025); Tata Steel 3.4, L&T 3.5 (India)",
    year: 2026,
    notes: "Heavy manufacturing and industrial companies in India typically rate 3.2–3.5",
  },

  "Energy": {
    standard: 3.5,
    source: "Glassdoor + AmbitionBox India",
    citation: "NTPC 3.6, Tata Power 3.5, ONGC 3.3 (Glassdoor India 2025); PSU energy companies have stable but bureaucratic culture",
    year: 2026,
    notes: "PSU energy companies offer good job security (rated higher) but slow career growth (rated lower); net average 3.5",
  },

  // ── Services & Mobility ─────────────────────────────────────────────────

  "Consulting": {
    standard: 3.5,
    source: "Glassdoor",
    citation: "Glassdoor Management Consulting industry average 3.5–3.7 (global); Deloitte India 3.6, EY India 3.5, PwC India 3.6, KPMG India 3.5",
    year: 2026,
    notes: "Big4 consulting in India rated higher than IT services; better brand perception and diverse work",
  },

  "Mobility": {
    standard: 3.3,
    source: "Glassdoor",
    citation: "Ola 3.2, Uber India 3.5 (Glassdoor India 2025); average 3.3 for mobility/ride-hailing sector",
    year: 2026,
    notes: "Indian mobility companies known for high-pressure targets and frequent restructuring; Uber rates higher than Ola",
  },

  "Logistics": {
    standard: 3.2,
    source: "Glassdoor",
    citation: "Glassdoor Logistics & Supply Chain average 3.2 (global); Delhivery 3.3, Blue Dart 3.4 (Glassdoor India 2025)",
    year: 2026,
    notes: "Logistics sector has high operational pressure, shift work, and competitive pressures from e-commerce growth",
  },

  "Services": {
    standard: 3.4,
    source: "Glassdoor",
    citation: "Urban Company 3.5 (Glassdoor India 2025); services industry average 3.3–3.5",
    year: 2026,
    notes: "On-demand services companies have mixed ratings; corporate staff rates higher than field staff",
  },

  "Hospitality": {
    standard: 3.2,
    source: "Glassdoor",
    citation: "OYO 3.0–3.2 (Glassdoor India 2025); hospitality sector known for high attrition and low ratings",
    year: 2026,
    notes: "OYO has had particularly turbulent history with layoffs; hospitality average is among the lowest sectors",
  },

  // ── Healthcare & Life Sciences ──────────────────────────────────────────

  "Pharma": {
    standard: 3.5,
    source: "Glassdoor",
    citation: "Glassdoor Biotech & Pharmaceutical average 3.5 (2025 Best Places list); Sun Pharma 3.3, Dr. Reddy's 3.5, Cipla 3.6 (Glassdoor India)",
    year: 2026,
    notes: "Indian pharma companies rate around average; MNC pharma subsidiaries tend to rate higher than domestic firms",
  },

  "Healthcare": {
    standard: 3.5,
    source: "Glassdoor",
    citation: "Glassdoor Healthcare average 3.5 (9 companies featured in 2025 Best Places); Apollo Hospitals 3.4, Fortis 3.3 (Glassdoor India)",
    year: 2026,
    notes: "Indian hospital chains rate moderate; high work pressure in clinical roles but good brand perception",
  },

  // ── Media & Entertainment ───────────────────────────────────────────────

  "Gaming": {
    standard: 3.6,
    source: "Glassdoor",
    citation: "Glassdoor Technology / Entertainment average; Dream11 3.7, MPL 3.5 (Glassdoor India 2025)",
    year: 2026,
    notes: "Indian gaming companies trend higher due to younger workforce, flat hierarchy, and exciting product domain",
  },

  "Media": {
    standard: 3.4,
    source: "Glassdoor",
    citation: "Glassdoor Media & Publishing average 3.4 (global); ShareChat 3.3, InMobi 3.5, Times Internet 3.6 (Glassdoor India)",
    year: 2026,
    notes: "Indian digital media companies range widely; established players (Times) rate higher than startups",
  },

  // ── Education ───────────────────────────────────────────────────────────

  "EdTech": {
    standard: 3.2,
    source: "Glassdoor + AmbitionBox India",
    citation: "BYJU's 2.9, Unacademy 3.2, upGrad 3.4, Vedantu 3.1 (Glassdoor India 2025); sector benchmark 3.2",
    year: 2026,
    notes: "Indian EdTech sector has seen mass layoffs (2022–2024) and poor ratings; BYJU's particularly low. Emerging players rate better",
  },

  // ── Real Estate ─────────────────────────────────────────────────────────

  "Real Estate": {
    standard: 3.3,
    source: "Glassdoor",
    citation: "Glassdoor Real Estate industry average 3.2–3.4 (global); DLF 3.3, Lodha 3.4, Godrej Properties 3.5 (Glassdoor India)",
    year: 2026,
    notes: "Real estate in India has target-driven sales culture; developer side rates lower than property management",
  },

  // ── Telecom ─────────────────────────────────────────────────────────────

  "Telecom": {
    standard: 3.2,
    source: "Glassdoor",
    citation: "Glassdoor Telecommunications average 3.2 (global); Jio 3.4, Airtel 3.3, Vodafone Idea 2.9, BSNL 3.1 (Glassdoor India 2025)",
    year: 2026,
    notes: "Indian telecom sector under consolidation pressure; Vodafone Idea and BSNL dragging average down significantly",
  },

  // ── Default fallback ─────────────────────────────────────────────────────

  "default": {
    standard: 3.5,
    source: "Glassdoor",
    citation: "Glassdoor global average across all industries (2025–2026): 3.5–3.7",
    year: 2026,
    notes: "Used for industries not explicitly mapped. Represents the global median across all Glassdoor sectors",
  },
};

/**
 * Returns the industry standard for the given industry.
 * Falls back to default if industry not found.
 */
export function getIndustryStandard(industry: string | null): IndustryStandard {
  if (!industry) return INDUSTRY_STANDARDS["default"];
  return INDUSTRY_STANDARDS[industry] ?? INDUSTRY_STANDARDS["default"];
}

/**
 * Benchmark interpretation — 5-tier system.
 * Thresholds based on standard deviation logic (±0.1 and ±0.3 on a 5-point scale).
 *
 * Returns null if company rating is null.
 */
export function getBenchmarkLabel(
  companyRating: number | null,
  industryStandard: number
): { label: string; tier: "top" | "above" | "average" | "below" | "bottom" } | null {
  if (companyRating === null) return null;

  const diff = companyRating - industryStandard;

  if (diff >= 0.3)  return { label: "Top performers", tier: "top" };
  if (diff >= 0.1)  return { label: "Above average", tier: "above" };
  if (diff >= -0.1) return { label: "On par with industry", tier: "average" };
  if (diff >= -0.3) return { label: "Below average", tier: "below" };
  return             { label: "Bottom performers", tier: "bottom" };
}
