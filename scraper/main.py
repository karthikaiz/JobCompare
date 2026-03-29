from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ambitionbox, glassdoor_mock, sentiment

app = FastAPI(
    title="JobCompare Scraper Service",
    description="Scraping and sentiment analysis API for JobCompare",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ambitionbox.router, prefix="/scrape", tags=["AmbitionBox"])
app.include_router(glassdoor_mock.router, prefix="/mock", tags=["Glassdoor Mock"])
app.include_router(sentiment.router, prefix="/analyze", tags=["Sentiment Analysis"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "jobcompare-scraper"}
