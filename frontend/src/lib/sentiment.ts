/**
 * Lightweight sentiment classifier for reviews.
 *
 * Uses the review's star rating as the primary signal:
 * - 4-5 stars → positive
 * - 3 stars → neutral
 * - 1-2 stars → negative
 *
 * Falls back to keyword analysis of pros/cons when no rating is available.
 */

const POSITIVE_WORDS = [
  "great", "good", "excellent", "amazing", "awesome", "best",
  "love", "enjoy", "happy", "fantastic", "wonderful", "friendly",
  "recommend", "supportive", "growth", "learning", "flexible",
];

const NEGATIVE_WORDS = [
  "bad", "worst", "terrible", "horrible", "poor", "toxic",
  "hate", "avoid", "low", "politics", "stressful", "unfair",
  "layoff", "fired", "micromanagement", "no growth", "underpaid",
];

export function classifySentiment(
  rating: number | null | undefined,
  pros: string,
  cons: string
): { sentiment: string; score: number } {
  // Primary: use rating if available
  if (rating != null && rating > 0) {
    if (rating >= 4) return { sentiment: "positive", score: 0.6 };
    if (rating <= 2) return { sentiment: "negative", score: -0.6 };
    return { sentiment: "neutral", score: 0.0 };
  }

  // Fallback: keyword analysis
  const prosLower = pros.toLowerCase();
  const consLower = cons.toLowerCase();

  let posScore = 0;
  let negScore = 0;

  for (const word of POSITIVE_WORDS) {
    if (prosLower.includes(word)) posScore++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (consLower.includes(word)) negScore++;
  }

  const total = posScore + negScore;
  if (total === 0) return { sentiment: "neutral", score: 0.0 };

  const score = (posScore - negScore) / total;
  if (score > 0.2) return { sentiment: "positive", score };
  if (score < -0.2) return { sentiment: "negative", score };
  return { sentiment: "neutral", score };
}
