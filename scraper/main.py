import os
import subprocess

from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routers import ambitionbox, glassdoor_mock, sentiment, registry

app = FastAPI(
    title="JobCompare Scraper Service",
    description="Scraping and sentiment analysis API for JobCompare",
    version="1.0.0",
)

# CORS: allow local dev + production Vercel URL
cors_origins = ["http://localhost:3000", "http://localhost:3001"]
vercel_url = os.getenv("VERCEL_PRODUCTION_URL")
if vercel_url:
    cors_origins.append(f"https://{vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ambitionbox.router, prefix="/scrape", tags=["AmbitionBox"])
app.include_router(glassdoor_mock.router, prefix="/mock", tags=["Glassdoor Mock"])
app.include_router(sentiment.router, prefix="/analyze", tags=["Sentiment Analysis"])
app.include_router(registry.router, tags=["Company Registry"])

SCRAPE_WEBHOOK_TOKEN = os.getenv("SCRAPE_WEBHOOK_TOKEN", "")


class ScrapeRequest(BaseModel):
    token: str


def run_scraper_task():
    """Run batch scraper and pipeline as a background task."""
    scraper_dir = os.path.dirname(os.path.abspath(__file__))
    env = os.environ.copy()

    print("🚀 Starting batch scrape...")
    subprocess.run(["python", "batch.py"], cwd=scraper_dir, env=env)
    print("✓ Batch scrape completed")

    print("📊 Starting data pipeline...")
    subprocess.run(["python", "pipeline.py"], cwd=scraper_dir, env=env)
    print("✓ Pipeline completed")


@app.post("/trigger-scrape")
async def trigger_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Webhook endpoint to trigger scraper. Called by GitHub Actions daily."""
    if SCRAPE_WEBHOOK_TOKEN and request.token != SCRAPE_WEBHOOK_TOKEN:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid token")

    background_tasks.add_task(run_scraper_task)
    return {"status": "queued", "message": "Scraper job queued. Check Render logs for progress."}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "jobcompare-scraper"}
