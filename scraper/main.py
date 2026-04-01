import os
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routers import ambitionbox, glassdoor_mock, sentiment, registry

app = FastAPI(
    title="JobCompare Scraper Service",
    description="Scraping and sentiment analysis API for JobCompare",
    version="1.0.0",
)


class ScrapeRequest(BaseModel):
    token: str

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


@app.post("/trigger-scrape")
async def trigger_scrape(request: ScrapeRequest):
    """Webhook endpoint to trigger batch scraping and data pipeline.

    Called by GitHub Actions to run the daily scraper without being blocked by IP restrictions.
    Requires valid SCRAPE_WEBHOOK_TOKEN for authentication.
    """
    webhook_token = os.getenv("SCRAPE_WEBHOOK_TOKEN", "")
    if not webhook_token or request.token != webhook_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        print("🚀 Starting batch scrape...")
        result = subprocess.run(
            ["python", "batch.py", "--all"],
            cwd="/app/scraper" if os.path.exists("/app/scraper") else ".",
            capture_output=True,
            text=True,
            timeout=1800,  # 30 min timeout
        )

        if result.returncode != 0:
            print(f"❌ Batch scrape failed: {result.stderr}")
            return {"status": "error", "stage": "batch", "error": result.stderr}

        print("✓ Batch scrape completed")
        print("📊 Starting data pipeline...")

        result = subprocess.run(
            ["python", "pipeline.py"],
            cwd="/app/scraper" if os.path.exists("/app/scraper") else ".",
            capture_output=True,
            text=True,
            timeout=600,  # 10 min timeout
        )

        if result.returncode != 0:
            print(f"❌ Pipeline failed: {result.stderr}")
            return {"status": "error", "stage": "pipeline", "error": result.stderr}

        print("✓ Pipeline completed")
        return {
            "status": "success",
            "message": "Scrape and pipeline completed successfully"
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Scraping timed out")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "jobcompare-scraper"}
