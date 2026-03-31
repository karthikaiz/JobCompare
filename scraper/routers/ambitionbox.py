import re

from fastapi import APIRouter, HTTPException, Query
from models.schemas import CompanyData
from scrapers.ambitionbox import AmbitionBoxScraper

router = APIRouter()
scraper = AmbitionBoxScraper()

SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{0,200}$")


def validate_slug(slug: str) -> str:
    if not SLUG_PATTERN.match(slug):
        raise HTTPException(status_code=400, detail="Invalid slug format")
    return slug


@router.get("/ambitionbox/{company_slug}", response_model=CompanyData)
async def scrape_ambitionbox(
    company_slug: str,
    max_review_pages: int = Query(default=2, ge=1, le=10, description="Max review pages to scrape"),
):
    """Scrape company data from AmbitionBox (overview, reviews, salaries, benefits)."""
    validate_slug(company_slug)
    try:
        company_data = await scraper.scrape_company(company_slug)
        return company_data
    except Exception as e:
        print(f"Scrape error for {company_slug}: {e}")
        raise HTTPException(status_code=500, detail="Failed to scrape company data")


@router.get("/ambitionbox/{company_slug}/overview")
async def scrape_overview(company_slug: str):
    """Scrape only the company overview from AmbitionBox."""
    validate_slug(company_slug)
    try:
        return await scraper.scrape_overview(company_slug)
    except Exception as e:
        print(f"Scrape error for {company_slug}/overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to scrape overview")


@router.get("/ambitionbox/{company_slug}/reviews")
async def scrape_reviews(
    company_slug: str,
    max_pages: int = Query(default=2, ge=1, le=10),
):
    """Scrape company reviews from AmbitionBox."""
    validate_slug(company_slug)
    try:
        reviews = await scraper.scrape_reviews(company_slug, max_pages=max_pages)
        return {"company": company_slug, "count": len(reviews), "reviews": reviews}
    except Exception as e:
        print(f"Scrape error for {company_slug}/reviews: {e}")
        raise HTTPException(status_code=500, detail="Failed to scrape reviews")


@router.get("/ambitionbox/{company_slug}/salaries")
async def scrape_salaries(company_slug: str):
    """Scrape salary data from AmbitionBox."""
    validate_slug(company_slug)
    try:
        salaries = await scraper.scrape_salaries(company_slug)
        return {"company": company_slug, "count": len(salaries), "salaries": salaries}
    except Exception as e:
        print(f"Scrape error for {company_slug}/salaries: {e}")
        raise HTTPException(status_code=500, detail="Failed to scrape salaries")


@router.get("/ambitionbox/{company_slug}/benefits")
async def scrape_benefits(company_slug: str):
    """Scrape benefits data from AmbitionBox."""
    validate_slug(company_slug)
    try:
        benefits = await scraper.scrape_benefits(company_slug)
        return {"company": company_slug, "count": len(benefits), "benefits": benefits}
    except Exception as e:
        print(f"Scrape error for {company_slug}/benefits: {e}")
        raise HTTPException(status_code=500, detail="Failed to scrape benefits")
