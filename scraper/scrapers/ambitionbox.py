import json
import re
from scrapers.base import BaseScraper
from models.schemas import CompanyData, ReviewData, SalaryData, BenefitData

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


class AmbitionBoxScraper(BaseScraper):
    """Scraper for AmbitionBox public company pages."""

    BASE_URL = "https://www.ambitionbox.com"

    def _extract_next_data(self, html: str) -> dict:
        """Extract __NEXT_DATA__ JSON from a Next.js page.

        Tries the standard script tag first, then falls back to
        searching for any large JSON blob that looks like Next.js data.
        """
        # Primary: standard __NEXT_DATA__ script tag
        match = re.search(
            r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        if match:
            return json.loads(match.group(1))

        # Fallback 1: __NEXT_DATA__ without id attribute (some Next.js versions)
        match = re.search(
            r'__NEXT_DATA__\s*=\s*({.*?})\s*[;<]', html, re.DOTALL
        )
        if match:
            return json.loads(match.group(1))

        # Fallback 2: Any script tag with type=application/json containing pageProps
        json_scripts = re.findall(
            r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        for script_content in json_scripts:
            try:
                data = json.loads(script_content)
                if isinstance(data, dict) and ("pageProps" in data.get("props", {}) or "pageProps" in data):
                    return data
            except (json.JSONDecodeError, AttributeError):
                continue

        # Diagnostic: report what we actually got
        title_match = re.search(r"<title[^>]*>(.*?)</title>", html[:3000], re.DOTALL | re.IGNORECASE)
        title = title_match.group(1).strip()[:80] if title_match else "(no title)"
        has_next = "__NEXT" in html
        html_len = len(html)
        script_count = html.count("<script")

        raise ValueError(
            f"Could not find __NEXT_DATA__ in page. "
            f"Title: '{title}', HTML size: {html_len}, "
            f"Scripts: {script_count}, Has __NEXT ref: {has_next}"
        )

    async def scrape_overview(self, company_slug: str) -> dict:
        url = f"{self.BASE_URL}/overview/{company_slug}-overview"
        html = await self.fetch(url)
        data = self._extract_next_data(html)
        props = data.get("props", {}).get("pageProps", {})

        meta = props.get("companyMetaInformation", {})
        header = props.get("companyHeaderData", {})
        ratings_data = props.get("aggregatedRatingsData", {})
        rating_dist = (
            ratings_data.get("ratingDistribution", {})
            .get("data", {})
            .get("ratingsTwoDecimal", {})
        )

        hq = meta.get("hq", {})
        headquarters = hq.get("cityState", "") if isinstance(hq, dict) else ""

        industries = meta.get("primaryIndustry", [])
        industry = None
        if industries:
            ind = industries[0]
            industry = ind.get("name", str(ind)) if isinstance(ind, dict) else str(ind)

        employee_count = meta.get("indianEmployeeCountRange", meta.get("globalEmployeeCountRange"))

        return {
            "slug": company_slug,
            "name": header.get("companyName", meta.get("companyName", company_slug)),
            "logo_url": meta.get("logoUrl"),
            "industry": industry,
            "headquarters": headquarters,
            "employee_count": employee_count,
            "founded": int(meta.get("foundedYear")) if meta.get("foundedYear") else None,
            "website": meta.get("website"),
            "overall_rating": meta.get("rating"),
            "work_life_balance": rating_dist.get("workLifeRating"),
            "salary_benefits": rating_dist.get("compensationBenefitsRating"),
            "job_security": rating_dist.get("jobSecurityRating"),
            "career_growth": rating_dist.get("careerGrowthRating"),
            "company_culture": rating_dist.get("companyCultureRating"),
        }

    async def scrape_reviews(self, company_slug: str, max_pages: int = 3) -> list[ReviewData]:
        reviews = []
        for page in range(1, max_pages + 1):
            url = f"{self.BASE_URL}/reviews/{company_slug}-reviews?page={page}"
            try:
                html = await self.fetch(url)
                data = self._extract_next_data(html)
                props = data.get("props", {}).get("pageProps", {})
                reviews_data = props.get("reviewsData", [])

                if not reviews_data:
                    break

                for r in reviews_data:
                    job_profile = r.get("jobProfile", {}) or {}
                    job_location = r.get("jobLocation", {}) or {}

                    reviews.append(ReviewData(
                        title=r.get("reviewTitle"),
                        role=job_profile.get("name"),
                        location=job_location.get("name"),
                        rating=r.get("overallCompanyRating"),
                        pros=r.get("likesText") or "",
                        cons=r.get("disLikesText") or "",
                        is_current_employee=bool(r.get("continued")),
                        review_date=r.get("modifiedMachineReadable"),
                    ))

                # Check if there are more pages
                pagination = props.get("pagination", {})
                total_pages = pagination.get("totalPages", 1)
                if page >= total_pages:
                    break

            except Exception as e:
                print(f"Error scraping reviews page {page} for {company_slug}: {e}")
                break

        return reviews

    async def scrape_salaries(self, company_slug: str, max_roles: int = 8) -> list[SalaryData]:
        """Scrape salary data from AmbitionBox.

        Strategy: Get role URLs from main salary page JSON-LD,
        then fetch individual role pages for detailed salary data.
        """
        url = f"{self.BASE_URL}/salaries/{company_slug}-salaries"
        try:
            html = await self.fetch(url)
            salaries = []

            # Step 1: Get role URLs from JSON-LD ItemList
            role_urls = []
            ld_matches = re.findall(
                r'type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL
            )
            for m in ld_matches:
                try:
                    data = json.loads(m)
                    if data.get("@type") == "ItemList":
                        for item in data.get("itemListElement", [])[:max_roles]:
                            role_url = item.get("url", "")
                            role_name = item.get("name", "")
                            if role_url:
                                # Clean company name prefix from role name
                                clean_name = role_name
                                for prefix in [f"{company_slug} ", company_slug.replace('-', ' ').title() + " "]:
                                    if clean_name.lower().startswith(prefix.lower()):
                                        clean_name = clean_name[len(prefix):]
                                role_urls.append((clean_name, role_url))
                except json.JSONDecodeError:
                    continue

            # Step 2: Fetch individual role pages for salary details
            for role_name, role_path in role_urls:
                role_url = f"{self.BASE_URL}{role_path}" if role_path.startswith("/") else role_path
                try:
                    role_html = await self.fetch(role_url)
                    role_ld = re.findall(
                        r'type="application/ld\+json"[^>]*>(.*?)</script>', role_html, re.DOTALL
                    )
                    for rm in role_ld:
                        try:
                            rdata = json.loads(rm)
                            if "Occupation" in rdata.get("@type", ""):
                                for sal in rdata.get("estimatedSalary", []):
                                    if sal.get("name") == "base":
                                        p10 = int(float(sal.get("percentile10", 0)))
                                        median = int(float(sal.get("median", 0)))
                                        p90 = int(float(sal.get("percentile90", 0)))
                                        min_exp = rdata.get("yearsExperienceMin")
                                        max_exp = rdata.get("yearsExperienceMax")

                                        experience = None
                                        if min_exp is not None and max_exp is not None:
                                            experience = f"{min_exp}-{max_exp} years"

                                        if p10 > 0 and p90 > 0:
                                            salaries.append(SalaryData(
                                                role=rdata.get("name", role_name),
                                                min_salary=p10,
                                                max_salary=p90,
                                                avg_salary=median,
                                                currency=sal.get("currency", "INR"),
                                                experience=experience,
                                            ))
                                        break
                        except json.JSONDecodeError:
                            continue
                except Exception as e:
                    print(f"Error fetching salary for role {role_name}: {e}")
                    continue

            return salaries

        except Exception as e:
            print(f"Error scraping salaries for {company_slug}: {e}")
            return []

    async def scrape_benefits(self, company_slug: str) -> list[BenefitData]:
        url = f"{self.BASE_URL}/benefits/{company_slug}-benefits"
        try:
            html = await self.fetch(url)
            data = self._extract_next_data(html)
            props = data.get("props", {}).get("pageProps", {})

            benefits = []
            benefits_data = (
                props.get("companyBenefitsData", {})
                .get("data", {})
                .get("categories", [])
            )

            for category in benefits_data:
                category_name = category.get("categoryName", "Other")
                for benefit in category.get("categoryValues", []):
                    if benefit.get("available", False) or benefit.get("availableCount", 0) > 0:
                        total = benefit.get("totalCount", 0)
                        available = benefit.get("availableCount", 0)
                        pct = round(available / total * 100) if total > 0 else 0

                        benefits.append(BenefitData(
                            category=self._map_category(category_name),
                            name=benefit.get("benefitName", ""),
                            details=f"Reported by {available} employees ({pct}% of respondents)",
                        ))

            # Also check employer-verified benefits
            verified = (
                props.get("employerverifiedBenefits", {})
                .get("data", {})
                .get("benefits", [])
            )
            for b in verified:
                benefits.append(BenefitData(
                    category="perks",
                    name=b.get("text", ""),
                    details=b.get("description", "Employer verified"),
                ))

            return benefits

        except Exception as e:
            print(f"Error scraping benefits for {company_slug}: {e}")
            return []

    def _map_category(self, ab_category: str) -> str:
        mapping = {
            "Health & Medical": "health",
            "Office Perks": "perks",
            "Financial & Retirement": "financial",
            "Vacation & Time Off": "leave",
            "Insurance": "insurance",
            "Professional Support": "perks",
            "Family Support": "perks",
            "Soft Skill Training": "perks",
            "Work From Home": "perks",
            "Child Care & Parental": "leave",
        }
        return mapping.get(ab_category, "perks")

    async def scrape_company(self, company_slug: str) -> CompanyData:
        """Scrape all available data for a company."""
        # Scrape overview first to get basic company info
        overview = await self.scrape_overview(company_slug)

        # Then scrape reviews, salaries, and benefits
        reviews = await self.scrape_reviews(company_slug)
        salaries = await self.scrape_salaries(company_slug)
        benefits = await self.scrape_benefits(company_slug)

        return CompanyData(
            **overview,
            reviews=reviews,
            salaries=salaries,
            benefits=benefits,
        )
