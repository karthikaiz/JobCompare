import json
import re
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

router = APIRouter()

REGISTRY_PATH = Path(__file__).parent.parent / "data" / "company_registry.json"
STATUS_PATH = Path(__file__).parent.parent / "data" / "scrape_status.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}


def load_registry() -> dict:
    with open(REGISTRY_PATH) as f:
        return json.load(f)


def save_registry(data: dict):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_status() -> dict:
    if STATUS_PATH.exists():
        with open(STATUS_PATH) as f:
            return json.load(f)
    return {}


class AddCompanyRequest(BaseModel):
    name: str
    industry: str = "Other"

    @field_validator("name")
    @classmethod
    def name_length(cls, v: str) -> str:
        if len(v.strip()) == 0:
            raise ValueError("name cannot be empty")
        if len(v) > 200:
            raise ValueError("name must be under 200 characters")
        return v.strip()

    @field_validator("industry")
    @classmethod
    def industry_length(cls, v: str) -> str:
        if len(v) > 100:
            raise ValueError("industry must be under 100 characters")
        return v.strip()


class CompanyEntry(BaseModel):
    name: str
    slug: str
    industry: str
    status: str | None = None
    last_scraped: str | None = None
    reviews: int | None = None
    salaries: int | None = None
    benefits: int | None = None
    interviews: int | None = None


async def discover_slug(company_name: str) -> dict | None:
    """Try to find a company on AmbitionBox by guessing the slug."""
    # Generate slug candidates from the name
    base = company_name.lower().strip()
    candidates = [
        re.sub(r"[^a-z0-9]+", "-", base).strip("-"),
        re.sub(r"[^a-z0-9]+", "-", base.replace("&", "and")).strip("-"),
        re.sub(r"[^a-z0-9]+", "-", base.split("(")[0].strip()).strip("-"),
    ]
    # Remove duplicates while preserving order
    seen = set()
    candidates = [c for c in candidates if c and c not in seen and not seen.add(c)]

    async with httpx.AsyncClient(headers=HEADERS, timeout=15.0, follow_redirects=True) as client:
        for slug in candidates:
            url = f"https://www.ambitionbox.com/overview/{slug}-overview"
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    # Extract actual slug from final URL (handles redirects)
                    final_url = str(resp.url)
                    match = re.search(r"/overview/(.+)-overview", final_url)
                    actual_slug = match.group(1) if match else slug

                    # Extract company name from page
                    nd_match = re.search(
                        r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
                        resp.text,
                        re.DOTALL,
                    )
                    actual_name = company_name
                    if nd_match:
                        try:
                            data = json.loads(nd_match.group(1))
                            props = data.get("props", {}).get("pageProps", {})
                            header = props.get("companyHeaderData", {})
                            actual_name = header.get("companyName", company_name)
                        except json.JSONDecodeError:
                            pass

                    return {"slug": actual_slug, "name": actual_name}
            except httpx.HTTPError:
                continue

    return None


@router.get("/registry", response_model=list[CompanyEntry])
async def list_companies():
    """List all registered companies with their scrape status."""
    registry = load_registry()
    status = load_status()

    result = []
    for company in registry["companies"]:
        slug = company["slug"]
        scrape_info = status.get(slug, {})

        result.append(CompanyEntry(
            name=company["name"],
            slug=slug,
            industry=company.get("industry", "Other"),
            status=scrape_info.get("status"),
            last_scraped=scrape_info.get("scraped_at"),
            reviews=scrape_info.get("reviews"),
            salaries=scrape_info.get("salaries"),
            benefits=scrape_info.get("benefits"),
            interviews=scrape_info.get("interviews"),
        ))

    return result


@router.post("/registry")
async def add_company(req: AddCompanyRequest):
    """Add a new company to the registry. Auto-discovers AmbitionBox slug."""
    registry = load_registry()

    # Check if already exists
    existing_slugs = {c["slug"] for c in registry["companies"]}
    existing_names = {c["name"].lower() for c in registry["companies"]}

    if req.name.lower() in existing_names:
        raise HTTPException(status_code=409, detail=f"'{req.name}' is already in the registry")

    # Auto-discover slug from AmbitionBox
    discovery = await discover_slug(req.name)
    if not discovery:
        raise HTTPException(
            status_code=404,
            detail=f"Could not find '{req.name}' on AmbitionBox. Try a different name or spelling.",
        )

    if discovery["slug"] in existing_slugs:
        raise HTTPException(
            status_code=409,
            detail=f"'{req.name}' resolves to slug '{discovery['slug']}' which is already registered",
        )

    # Add to registry
    new_entry = {
        "name": discovery["name"],
        "slug": discovery["slug"],
        "industry": req.industry,
    }
    registry["companies"].append(new_entry)
    save_registry(registry)

    return {
        "success": True,
        "message": f"Added '{discovery['name']}' (slug: {discovery['slug']})",
        "company": new_entry,
        "total_companies": len(registry["companies"]),
    }


@router.delete("/registry/{slug}")
async def remove_company(slug: str):
    """Remove a company from the registry."""
    registry = load_registry()

    original_count = len(registry["companies"])
    registry["companies"] = [c for c in registry["companies"] if c["slug"] != slug]

    if len(registry["companies"]) == original_count:
        raise HTTPException(status_code=404, detail=f"Company with slug '{slug}' not found in registry")

    save_registry(registry)

    return {
        "success": True,
        "message": f"Removed '{slug}' from registry",
        "total_companies": len(registry["companies"]),
    }
