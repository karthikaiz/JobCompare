#!/usr/bin/env python3
"""
JobCompare Scheduler — Orchestrates batch scraping + data pipeline.

Used by:
  - GitHub Actions (daily cron)
  - Local manual runs

Usage:
    python scheduler.py                  # Full run: scrape all + sentiment + save JSONs
    python scheduler.py --scrape-only    # Scrape only, skip pipeline
    python scheduler.py --pipeline-only  # Pipeline only (assumes scraped data exists)
    python scheduler.py --company tcs    # Single company: scrape + pipeline
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCRAPER_DIR = Path(__file__).parent
STATUS_FILE = SCRAPER_DIR / "data" / "scrape_status.json"
SCRAPED_DIR = SCRAPER_DIR / "data" / "scraped"


def run_command(cmd: list[str], label: str) -> bool:
    """Run a command and return True if successful."""
    print(f"\n{'─'*50}")
    print(f"▶ {label}")
    print(f"  Command: {' '.join(cmd)}")
    print(f"{'─'*50}")

    start = time.time()
    result = subprocess.run(cmd, cwd=str(SCRAPER_DIR))
    elapsed = round(time.time() - start, 1)

    if result.returncode == 0:
        print(f"✓ {label} completed in {elapsed}s")
        return True
    else:
        print(f"✗ {label} failed (exit code {result.returncode}) after {elapsed}s")
        return False


def generate_summary() -> dict:
    """Generate a summary from the scrape status file."""
    if not STATUS_FILE.exists():
        return {"total": 0, "succeeded": 0, "failed": 0, "companies": []}

    with open(STATUS_FILE) as f:
        status = json.load(f)

    succeeded = sum(1 for v in status.values() if v.get("status") == "success")
    failed = sum(1 for v in status.values() if v.get("status") == "failed")
    total_reviews = sum(v.get("reviews", 0) for v in status.values() if v.get("status") == "success")
    total_salaries = sum(v.get("salaries", 0) for v in status.values() if v.get("status") == "success")

    failed_companies = [k for k, v in status.items() if v.get("status") == "failed"]

    # Check for stale data (not updated in 48+ hours)
    stale = []
    now = datetime.now(timezone.utc)
    for slug, info in status.items():
        if info.get("scraped_at"):
            scraped_at = datetime.fromisoformat(info["scraped_at"])
            hours_ago = (now - scraped_at).total_seconds() / 3600
            if hours_ago > 48:
                stale.append(slug)

    return {
        "total": len(status),
        "succeeded": succeeded,
        "failed": failed,
        "total_reviews": total_reviews,
        "total_salaries": total_salaries,
        "failed_companies": failed_companies,
        "stale_companies": stale,
    }


def main():
    parser = argparse.ArgumentParser(description="JobCompare Scheduler")
    parser.add_argument("--scrape-only", action="store_true", help="Only run batch scraper, skip pipeline")
    parser.add_argument("--pipeline-only", action="store_true", help="Only run pipeline, skip scraping")
    parser.add_argument("--company", type=str, help="Process a single company")
    parser.add_argument("--dry-run", action="store_true", help="Pipeline dry run (no DB sync)")

    args = parser.parse_args()
    python = sys.executable
    start_time = time.time()

    print(f"{'='*60}")
    print(f"JobCompare Scheduler")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python: {python}")
    print(f"{'='*60}")

    scrape_ok = True
    pipeline_ok = True

    # Step 1: Batch scrape
    if not args.pipeline_only:
        if args.company:
            scrape_cmd = [python, "batch.py", "--company", args.company]
            scrape_ok = run_command(scrape_cmd, f"Scraping {args.company}")
        else:
            scrape_cmd = [python, "batch.py", "--all"]
            scrape_ok = run_command(scrape_cmd, "Batch scraping all companies")

        # Retry failed companies
        if scrape_ok and not args.company:
            summary = generate_summary()
            if summary["failed"] > 0:
                print(f"\n⚠ {summary['failed']} companies failed. Retrying...")
                retry_cmd = [python, "batch.py", "--failed"]
                run_command(retry_cmd, "Retrying failed companies")

    # Step 2: Data pipeline (sentiment + format)
    if not args.scrape_only:
        pipeline_cmd = [python, "pipeline.py"]
        if args.company:
            pipeline_cmd.extend(["--company", args.company])
        if args.dry_run:
            pipeline_cmd.append("--dry-run")
        pipeline_ok = run_command(pipeline_cmd, "Data pipeline (sentiment + sync)")

    # Step 3: Summary
    elapsed = round(time.time() - start_time, 1)
    summary = generate_summary()

    print(f"\n{'='*60}")
    print(f"SCHEDULER COMPLETE")
    print(f"  Time:           {elapsed}s ({round(elapsed/60, 1)} min)")
    print(f"  Companies:      {summary['total']}")
    print(f"  Succeeded:      {summary['succeeded']}")
    print(f"  Failed:         {summary['failed']}")
    print(f"  Total reviews:  {summary.get('total_reviews', '?')}")
    print(f"  Total salaries: {summary.get('total_salaries', '?')}")

    if summary.get("failed_companies"):
        print(f"  Failed:         {', '.join(summary['failed_companies'])}")
    if summary.get("stale_companies"):
        print(f"  Stale (48h+):   {', '.join(summary['stale_companies'])}")

    print(f"{'='*60}\n")

    # Write summary to a file (useful for GitHub Actions)
    summary["completed_at"] = datetime.now(timezone.utc).isoformat()
    summary["elapsed_seconds"] = elapsed
    summary_path = SCRAPER_DIR / "data" / "last_run_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # Exit with error code if anything failed
    if not scrape_ok or not pipeline_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
