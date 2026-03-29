export interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  headquarters: string | null;
  employeeCount: string | null;
  founded: number | null;
  website: string | null;
  overallRating: number | null;
  workLifeBalance: number | null;
  salaryBenefits: number | null;
  jobSecurity: number | null;
  careerGrowth: number | null;
  companyCulture: number | null;
  source: string;
  lastScrapedAt: string | null;
  reviews: Review[];
  salaries: SalaryData[];
  benefits: BenefitData[];
  sentimentData: SentimentSnapshot[];
  userReviews: UserReview[];
}

export interface Review {
  id: string;
  title: string | null;
  role: string | null;
  location: string | null;
  rating: number | null;
  pros: string;
  cons: string;
  sentiment: string | null;
  sentimentScore: number | null;
  isCurrentEmployee: boolean | null;
  reviewDate: string | null;
}

export interface SalaryData {
  id: string;
  role: string;
  location: string | null;
  minSalary: number;
  maxSalary: number;
  avgSalary: number | null;
  currency: string;
  experience: string | null;
  sampleCount: number | null;
}

export interface BenefitData {
  id: string;
  category: string;
  name: string;
  details: string | null;
}

export interface SentimentSnapshot {
  id: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topPositiveThemes: string;
  topNegativeThemes: string;
  analyzedAt: string;
}

export interface UserReview {
  id: string;
  userId: string;
  title: string;
  role: string;
  location: string | null;
  overallRating: number;
  workLifeBalanceRating: number | null;
  salaryRating: number | null;
  jobSecurityRating: number | null;
  careerGrowthRating: number | null;
  companyCultureRating: number | null;
  pros: string;
  cons: string;
  isAnonymous: boolean;
  isCurrentEmployee: boolean;
  upvotes: number;
  createdAt: string;
  user?: { displayName: string | null };
}

export interface CompanySearchResult {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
  headquarters: string | null;
}
