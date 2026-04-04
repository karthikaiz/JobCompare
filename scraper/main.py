import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "jobcompare-scraper"}
