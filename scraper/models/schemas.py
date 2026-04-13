from pydantic import BaseModel


class ReviewData(BaseModel):
    title: str | None = None
    role: str | None = None
    location: str | None = None
    rating: float | None = None
    pros: str
    cons: str
    sentiment: str | None = None
    sentiment_score: float | None = None
    is_current_employee: bool | None = None
    review_date: str | None = None


class SalaryData(BaseModel):
    role: str
    location: str | None = None
    min_salary: int
    max_salary: int
    avg_salary: int | None = None
    currency: str = "INR"
    experience: str | None = None
    sample_count: int | None = None


class BenefitData(BaseModel):
    category: str
    name: str
    details: str | None = None


class SentimentResult(BaseModel):
    sentiment: str  # "positive", "negative", "neutral"
    score: float  # -1.0 to 1.0
    positive_score: float
    negative_score: float
    neutral_score: float


class SentimentThemes(BaseModel):
    positive_count: int
    negative_count: int
    neutral_count: int
    top_positive_themes: list[str]
    top_negative_themes: list[str]


class CompanyData(BaseModel):
    slug: str
    name: str
    logo_url: str | None = None
    industry: str | None = None
    headquarters: str | None = None
    employee_count: str | None = None
    founded: int | None = None
    website: str | None = None
    overall_rating: float | None = None
    work_life_balance: float | None = None
    salary_benefits: float | None = None
    job_security: float | None = None
    career_growth: float | None = None
    company_culture: float | None = None
    reviews: list[ReviewData] = []
    salaries: list[SalaryData] = []
    benefits: list[BenefitData] = []


class InterviewQuestion(BaseModel):
    question: str
    answer: str | None = None


class InterviewData(BaseModel):
    role: str | None = None
    difficulty: str | None = None  # "easy", "medium", "hard"
    experience: str | None = None  # "positive", "negative", "neutral"
    process: str | None = None     # comma-separated steps
    questions: list[InterviewQuestion] = []
    review_date: str | None = None


class SentimentRequest(BaseModel):
    texts: list[str]


class SentimentBatchResult(BaseModel):
    results: list[SentimentResult]
    themes: SentimentThemes
