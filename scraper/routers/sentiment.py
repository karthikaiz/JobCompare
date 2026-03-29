from fastapi import APIRouter
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import Counter
import re

from models.schemas import SentimentRequest, SentimentBatchResult, SentimentResult, SentimentThemes

router = APIRouter()
analyzer = SentimentIntensityAnalyzer()

THEME_KEYWORDS = {
    "work-life balance": ["work life", "wlb", "work-life", "hours", "overtime", "flexible", "remote"],
    "salary & compensation": ["salary", "pay", "compensation", "hike", "increment", "ctc", "package"],
    "management": ["management", "manager", "leadership", "boss", "lead"],
    "career growth": ["growth", "career", "promotion", "learning", "opportunity", "appraisal"],
    "job security": ["security", "stable", "layoff", "fired", "bench"],
    "company culture": ["culture", "environment", "team", "colleagues", "toxic", "politics"],
    "benefits": ["benefits", "insurance", "health", "leave", "perks", "cab", "food"],
    "technology": ["technology", "tech", "stack", "tools", "legacy", "modern"],
    "training": ["training", "skill", "development", "certification"],
    "location": ["location", "office", "commute", "wfh", "hybrid"],
}


def extract_themes(texts: list[str]) -> list[str]:
    theme_counts: Counter[str] = Counter()
    for text in texts:
        text_lower = text.lower()
        for theme, keywords in THEME_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                theme_counts[theme] += 1
    return [theme for theme, _ in theme_counts.most_common(5)]


@router.post("/sentiment", response_model=SentimentBatchResult)
async def analyze_sentiment(request: SentimentRequest):
    results: list[SentimentResult] = []
    positive_texts: list[str] = []
    negative_texts: list[str] = []
    pos_count = neg_count = neu_count = 0

    for text in request.texts:
        scores = analyzer.polarity_scores(text)
        compound = scores["compound"]

        if compound >= 0.05:
            sentiment = "positive"
            pos_count += 1
            positive_texts.append(text)
        elif compound <= -0.05:
            sentiment = "negative"
            neg_count += 1
            negative_texts.append(text)
        else:
            sentiment = "neutral"
            neu_count += 1

        results.append(SentimentResult(
            sentiment=sentiment,
            score=compound,
            positive_score=scores["pos"],
            negative_score=scores["neg"],
            neutral_score=scores["neu"],
        ))

    themes = SentimentThemes(
        positive_count=pos_count,
        negative_count=neg_count,
        neutral_count=neu_count,
        top_positive_themes=extract_themes(positive_texts),
        top_negative_themes=extract_themes(negative_texts),
    )

    return SentimentBatchResult(results=results, themes=themes)
