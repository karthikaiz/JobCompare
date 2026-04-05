#!/usr/bin/env python3
"""
Batch scraper for JobCompare.
Processes all companies in the registry and saves results as individual JSON files.

Usage:
    python batch.py --all                    # Scrape all companies
    python batch.py --company infosys        # Scrape a single company
    python batch.py --failed                 # Retry previously failed companies
    python batch.py --all --max-reviews 5    # Scrape with more review pages
"""

import argparse
import asyncio
import json
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Add parent dir to path so we can import scraper modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import re

from scrapers.ambitionbox import AmbitionBoxScraper

SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{0,200}$")
REGISTRY_PATH = Path(__file__).parent / "data" / "company_registry.json"
SCRAPED_DIR = Path(__file__).parent / "data" / "scraped"
STATUS_FILE = Path(__file__).parent / "data" / "scrape_status.json"


def load_registry() -> list[dict]:
    with open(REGISTRY_PATH) as f:
        data = json.load(f)
    return data["companies"]


def load_status() -> dict:
    if STATUS_FILE.exists():
        with open(STATUS_FILE) as f:
            return json.load(f)
    return {}


def save_status(status: dict):
    with open(STATUS_FILE, "w") as f:
        json.dump(status, f, indent=2, default=str)


def get_failed_companies(registry: list[dict], status: dict) -> list[dict]:
    failed = []
    for company in registry:
        slug = company["slug"]
        if slug in status and status[slug].get("status") == "failed":
            failed.append(company)
    return failed


async def scrape_company(
    scraper: AmbitionBoxScraper,
    company: dict,
    max_review_pages: int = 2,
    max_salary_roles: int = 8,
) -> dict | None:
    """Scrape a single company and return the data dict, or None on failure."""
    slug = company["slug"]
    name = company["name"]

    try:
        print(f"  Scraping {name} ({slug})...", end=" ", flush=True)
        start = time.time()

        data = await scraper.scrape_company(slug, max_review_pages=max_review_pages, max_salary_roles=max_salary_roles)
        result = data.model_dump()

        elapsed = round(time.time() - start, 1)
        review_count = len(result.get("reviews", []))
        salary_count = len(result.get("salaries", []))
        benefit_count = len(result.get("benefits", []))

        print(
            f"OK ({elapsed}s) — "
            f"{review_count} reviews, {salary_count} salaries, {benefit_count} benefits"
        )
        return result

    except Exception as e:
        print(f"FAILED — {e}")
        return None


async def run_batch(
    companies: list[dict],
    max_review_pages: int = 2,
    max_salary_roles: int = 8,
):
    """Scrape a list of companies and save results."""
    SCRAPED_DIR.mkdir(parents=True, exist_ok=True)

    scraper = AmbitionBoxScraper()
    status = load_status()
    total = len(companies)
    succeeded = 0
    failed = 0
    failed_companies = []

    start_time = time.time()
    print(f"\n{'='*60}")
    print(f"JobCompare Batch Scraper")
    print(f"Companies: {total}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    try:
        for i, company in enumerate(companies, 1):
            slug = company["slug"]
            name = company["name"]
            print(f"[{i}/{total}]", end=" ")

            result = await scrape_company(
                scraper, company, max_review_pages, max_salary_roles
            )

            if result:
                # Validate slug before using as filename (prevent path traversal)
                if not SLUG_PATTERN.match(slug):
                    print(f"  WARNING: Invalid slug '{slug}', skipping file write")
                    failed += 1
                    continue

                # Add metadata
                result["_scraped_at"] = datetime.now(timezone.utc).isoformat()
                result["_source"] = "ambitionbox"
                result["_registry_name"] = name
                result["_registry_industry"] = company.get("industry", "")

                # Save to file
                output_path = SCRAPED_DIR / f"{slug}.json"
                with open(output_path, "w") as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)

                status[slug] = {
                    "status": "success",
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                    "reviews": len(result.get("reviews", [])),
                    "salaries": len(result.get("salaries", [])),
                    "benefits": len(result.get("benefits", [])),
                }
                succeeded += 1
            else:
                status[slug] = {
                    "status": "failed",
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                    "error": "Scrape returned no data",
                }
                failed += 1
                failed_companies.append(company)

            # Save status after each company (resume-friendly)
            save_status(status)

        # Auto-retry failed companies once with a fresh session
        if failed_companies and len(failed_companies) < total:
            print(f"\n--- Retrying {len(failed_companies)} failed companies with fresh session ---\n")
            await scraper.close()
            # Extra delay before retry round
            await asyncio.sleep(random.uniform(10.0, 20.0))

            for i, company in enumerate(failed_companies, 1):
                slug = company["slug"]
                name = company["name"]
                print(f"[retry {i}/{len(failed_companies)}]", end=" ")

                result = await scrape_company(
                    scraper, company, max_review_pages, max_salary_roles
                )

                if result:
                    if not SLUG_PATTERN.match(slug):
                        print(f"  WARNING: Invalid slug '{slug}', skipping file write")
                        continue

                    result["_scraped_at"] = datetime.now(timezone.utc).isoformat()
                    result["_source"] = "ambitionbox"
                    result["_registry_name"] = name
                    result["_registry_industry"] = company.get("industry", "")

                    output_path = SCRAPED_DIR / f"{slug}.json"
                    with open(output_path, "w") as f:
                        json.dump(result, f, indent=2, ensure_ascii=False)

                    status[slug] = {
                        "status": "success",
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                        "reviews": len(result.get("reviews", [])),
                        "salaries": len(result.get("salaries", [])),
                        "benefits": len(result.get("benefits", [])),
                    }
                    succeeded += 1
                    failed -= 1

                save_status(status)
    finally:
        await scraper.close()

    elapsed = round(time.time() - start_time, 1)
    print(f"\n{'='*60}")
    print(f"BATCH COMPLETE")
    print(f"  Total:     {total}")
    print(f"  Succeeded: {succeeded}")
    print(f"  Failed:    {failed}")
    print(f"  Time:      {elapsed}s ({round(elapsed/60, 1)} min)")
    print(f"  Output:    {SCRAPED_DIR}")
    print(f"{'='*60}\n")

    return {"total": total, "succeeded": succeeded, "failed": failed, "elapsed": elapsed}


def main():
    parser = argparse.ArgumentParser(description="JobCompare Batch Scraper")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Scrape all companies in registry")
    group.add_argument("--company", type=str, help="Scrape a single company by slug")
    group.add_argument("--failed", action="store_true", help="Retry previously failed companies")
    parser.add_argument("--max-reviews", type=int, default=2, help="Max review pages per company (default: 2)")
    parser.add_argument("--max-salaries", type=int, default=8, help="Max salary roles per company (default: 8)")

    args = parser.parse_args()
    registry = load_registry()

    if args.all:
        companies = registry
    elif args.company:
        companies = [c for c in registry if c["slug"] == args.company]
        if not companies:
            # Try partial match
            companies = [c for c in registry if args.company.lower() in c["slug"].lower()]
        if not companies:
            print(f"Company '{args.company}' not found in registry.")
            print(f"Available: {', '.join(c['slug'] for c in registry[:10])}...")
            sys.exit(1)
    elif args.failed:
        status = load_status()
        companies = get_failed_companies(registry, status)
        if not companies:
            print("No failed companies to retry.")
            sys.exit(0)

    asyncio.run(run_batch(companies, args.max_reviews, args.max_salaries))


if __name__ == "__main__":
    main()
