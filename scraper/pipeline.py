#!/usr/bin/env python3
"""
Data pipeline for JobCompare.
Reads scraped JSON files, enriches with sentiment analysis, and syncs to the SQLite database
via the Next.js /api/sync endpoint.

Usage:
    python pipeline.py                       # Process all scraped files
    python pipeline.py --company infosys     # Process a single company
    python pipeline.py --dry-run             # Analyze without syncing to DB
"""

import argparse
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import httpx
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

SCRAPED_DIR = Path(__file__).parent / "data" / "scraped"
NEXTJS_SYNC_URL = os.getenv("NEXTJS_SYNC_URL", "http://localhost:3000/api/sync")
SYNC_API_KEY = os.getenv("SYNC_API_KEY", "")

# Theme keywords to detect in review text
THEME_KEYWORDS = {
    "work-life balance": ["work life balance", "work-life balance", "wlb", "working hours", "overtime", "weekend work", "flexible hours", "long hours"],
    "salary & compensation": ["salary", "compensation", "pay", "hike", "increment", "ctc", "package", "bonus", "variable pay", "low pay"],
    "management": ["management", "manager", "leadership", "lead", "supervisor", "boss", "reporting"],
    "career growth": ["growth", "promotion", "career", "learning", "opportunity", "appraisal", "development"],
    "company culture": ["culture", "environment", "diversity", "inclusive", "politics", "bureaucracy", "hierarchy"],
    "job security": ["job security", "layoff", "termination", "firing", "restructuring", "bench", "stable"],
    "benefits": ["insurance", "health", "medical", "leave", "pf", "provident fund", "perks", "food", "cab"],
    "technology": ["technology", "tech stack", "modern", "legacy", "outdated", "innovation", "tools"],
    "training": ["training", "learning", "certification", "upskilling", "course", "knowledge"],
    "onsite": ["onsite", "on-site", "abroad", "international", "travel", "client location"],
}


def analyze_sentiment(text: str, analyzer: SentimentIntensityAnalyzer) -> dict:
    """Analyze sentiment of a text using VADER."""
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "score": compound,
    }


def extract_themes(text: str) -> list[str]:
    """Extract themes from review text based on keyword matching."""
    text_lower = text.lower()
    found = []
    for theme, keywords in THEME_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                found.append(theme)
                break
    return found


def compute_company_sentiment(reviews: list[dict]) -> dict:
    """Compute aggregate sentiment data for a company."""
    positive = 0
    negative = 0
    neutral = 0
    positive_themes: Counter = Counter()
    negative_themes: Counter = Counter()

    for review in reviews:
        sentiment = review.get("sentiment")
        if sentiment == "positive":
            positive += 1
        elif sentiment == "negative":
            negative += 1
        else:
            neutral += 1

        # Extract themes from pros (positive) and cons (negative)
        pros = review.get("pros", "")
        cons = review.get("cons", "")

        for theme in extract_themes(pros):
            positive_themes[theme] += 1
        for theme in extract_themes(cons):
            negative_themes[theme] += 1

    return {
        "positiveCount": positive,
        "negativeCount": negative,
        "neutralCount": neutral,
        "topPositiveThemes": [t for t, _ in positive_themes.most_common(5)],
        "topNegativeThemes": [t for t, _ in negative_themes.most_common(5)],
    }


def format_for_sync(data: dict) -> dict:
    """Transform scraped JSON into the format expected by /api/sync."""
    return {
        "slug": data.get("slug", ""),
        "name": data.get("name", ""),
        "logoUrl": data.get("logo_url"),
        "industry": data.get("industry"),
        "headquarters": data.get("headquarters"),
        "employeeCount": data.get("employee_count"),
        "founded": int(data["founded"]) if data.get("founded") else None,
        "website": data.get("website"),
        "overallRating": data.get("overall_rating"),
        "workLifeBalance": data.get("work_life_balance"),
        "salaryBenefits": data.get("salary_benefits"),
        "jobSecurity": data.get("job_security"),
        "careerGrowth": data.get("career_growth"),
        "companyCulture": data.get("company_culture"),
        "source": data.get("_source", "ambitionbox"),
        "reviews": [
            {
                "title": r.get("title"),
                "role": r.get("role"),
                "location": r.get("location"),
                "rating": r.get("rating"),
                "pros": r.get("pros", ""),
                "cons": r.get("cons", ""),
                "sentiment": r.get("sentiment"),
                "sentimentScore": r.get("sentiment_score"),
                "isCurrentEmployee": r.get("is_current_employee"),
                "reviewDate": r.get("review_date"),
            }
            for r in data.get("reviews", [])
        ],
        "salaries": [
            {
                "role": s.get("role", ""),
                "location": s.get("location"),
                "minSalary": s.get("min_salary", 0),
                "maxSalary": s.get("max_salary", 0),
                "avgSalary": s.get("avg_salary"),
                "currency": s.get("currency", "INR"),
                "experience": s.get("experience"),
                "sampleCount": s.get("sample_count"),
            }
            for s in data.get("salaries", [])
        ],
        "benefits": [
            {
                "category": b.get("category", "perks"),
                "name": b.get("name", ""),
                "details": b.get("details"),
            }
            for b in data.get("benefits", [])
        ],
    }


def enrich_with_sentiment(data: dict, analyzer: SentimentIntensityAnalyzer) -> dict:
    """Add sentiment scores to all reviews and compute company-level sentiment."""
    for review in data.get("reviews", []):
        # Analyze combined pros + cons text
        combined = f"{review.get('pros', '')} {review.get('cons', '')}"
        if combined.strip():
            result = analyze_sentiment(combined, analyzer)
            review["sentiment"] = result["sentiment"]
            review["sentiment_score"] = result["score"]

    # Compute company-level sentiment snapshot
    data["_sentiment"] = compute_company_sentiment(data.get("reviews", []))
    return data


def sync_to_db(payload: dict, dry_run: bool = False) -> dict | None:
    """Send formatted data to the Next.js /api/sync endpoint."""
    if dry_run:
        return {"success": True, "dry_run": True}

    try:
        response = httpx.post(
            NEXTJS_SYNC_URL,
            json=payload,
            headers={"x-api-key": SYNC_API_KEY},
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"    Sync error: {e}")
        return None


def process_company(file_path: Path, analyzer: SentimentIntensityAnalyzer, dry_run: bool = False) -> dict | None:
    """Process a single company's scraped JSON file."""
    with open(file_path) as f:
        data = json.load(f)

    slug = data.get("slug", file_path.stem)
    name = data.get("name", slug)

    print(f"  Processing {name} ({slug})...", end=" ", flush=True)

    # Enrich with sentiment
    data = enrich_with_sentiment(data, analyzer)

    # Format for sync
    payload = format_for_sync(data)

    # Add sentiment snapshot
    payload["sentiment"] = data["_sentiment"]

    # Count stats
    review_count = len(payload["reviews"])
    positive = data["_sentiment"]["positiveCount"]
    negative = data["_sentiment"]["negativeCount"]
    neutral = data["_sentiment"]["neutralCount"]

    # Sync to DB
    result = sync_to_db(payload, dry_run)

    if result and result.get("success"):
        new_reviews = result.get("newReviews", review_count)
        skipped = result.get("skippedReviews", 0)
        print(
            f"OK — {review_count} reviews "
            f"(+{positive}/-{negative}/~{neutral}), "
            f"{new_reviews} new, {skipped} skipped"
        )
    elif dry_run:
        print(
            f"DRY RUN — {review_count} reviews "
            f"(+{positive}/-{negative}/~{neutral})"
        )
    else:
        print("SYNC FAILED")

    # Save enriched data back to file (with sentiment scores)
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return result


def main():
    parser = argparse.ArgumentParser(description="JobCompare Data Pipeline")
    parser.add_argument("--company", type=str, help="Process a single company by slug")
    parser.add_argument("--dry-run", action="store_true", help="Analyze sentiment without syncing to DB")
    parser.add_argument("--sync-url", type=str, help="Override the sync API URL")

    args = parser.parse_args()

    global NEXTJS_SYNC_URL
    if args.sync_url:
        NEXTJS_SYNC_URL = args.sync_url

    analyzer = SentimentIntensityAnalyzer()

    if args.company:
        file_path = SCRAPED_DIR / f"{args.company}.json"
        if not file_path.exists():
            print(f"No scraped data for '{args.company}'. Run batch.py first.")
            sys.exit(1)
        files = [file_path]
    else:
        files = sorted(SCRAPED_DIR.glob("*.json"))
        if not files:
            print("No scraped data found. Run batch.py first.")
            sys.exit(1)

    total = len(files)
    succeeded = 0
    failed = 0

    start_time = time.time()
    print(f"\n{'='*60}")
    print(f"JobCompare Data Pipeline")
    print(f"Companies: {total}")
    print(f"Sync URL: {NEXTJS_SYNC_URL}")
    print(f"Dry run: {args.dry_run}")
    print(f"{'='*60}\n")

    for i, file_path in enumerate(files, 1):
        print(f"[{i}/{total}]", end=" ")
        result = process_company(file_path, analyzer, args.dry_run)
        if result:
            succeeded += 1
        else:
            failed += 1

    elapsed = round(time.time() - start_time, 1)
    print(f"\n{'='*60}")
    print(f"PIPELINE COMPLETE")
    print(f"  Total:     {total}")
    print(f"  Succeeded: {succeeded}")
    print(f"  Failed:    {failed}")
    print(f"  Time:      {elapsed}s")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
