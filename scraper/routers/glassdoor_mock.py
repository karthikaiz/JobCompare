import json
import os
from fastapi import APIRouter, HTTPException
from models.schemas import CompanyData

router = APIRouter()

SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "seed_companies.json")


def load_seed_data() -> dict[str, dict]:
    if not os.path.exists(SEED_DATA_PATH):
        return {}
    with open(SEED_DATA_PATH, "r") as f:
        companies = json.load(f)
    return {c["slug"]: c for c in companies}


@router.get("/glassdoor/{company_slug}", response_model=CompanyData)
async def mock_glassdoor(company_slug: str):
    """Return mock Glassdoor data from seed file."""
    seed = load_seed_data()
    if company_slug not in seed:
        raise HTTPException(status_code=404, detail=f"No mock data for company: {company_slug}")
    return CompanyData(**seed[company_slug])
