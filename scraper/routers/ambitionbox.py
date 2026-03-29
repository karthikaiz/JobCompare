from fastapi import APIRouter, HTTPException
from models.schemas import CompanyData

router = APIRouter()


@router.get("/ambitionbox/{company_slug}", response_model=CompanyData)
async def scrape_ambitionbox(company_slug: str):
    """Scrape company data from AmbitionBox. (Stub for Story 1, implemented in Story 2)"""
    raise HTTPException(
        status_code=501,
        detail=f"AmbitionBox scraper not yet implemented. Company: {company_slug}. Will be built in Story 2."
    )
