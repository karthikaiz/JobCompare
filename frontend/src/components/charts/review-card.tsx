"use client";

interface Review {
  id: string;
  title: string | null;
  role: string | null;
  location: string | null;
  rating: number | null;
  pros: string;
  cons: string;
  sentiment: string | null;
  sentimentScore: number | null;
  isCurrentEmployee: boolean | null;
  reviewDate: string | null;
}

interface ReviewCardProps {
  review: Review;
}

function sentimentBorder(sentiment: string | null): string {
  switch (sentiment) {
    case "positive": return "border-l-green-500";
    case "negative": return "border-l-red-500";
    default: return "border-l-gray-300";
  }
}

function sentimentBadge(sentiment: string | null): { label: string; className: string } | null {
  switch (sentiment) {
    case "positive": return { label: "Positive", className: "bg-green-100 text-green-700" };
    case "negative": return { label: "Negative", className: "bg-red-100 text-red-700" };
    case "neutral": return { label: "Neutral", className: "bg-gray-100 text-gray-600" };
    default: return null;
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const badge = sentimentBadge(review.sentiment);
  const date = review.reviewDate
    ? new Date(review.reviewDate).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className={`border-l-4 ${sentimentBorder(review.sentiment)} bg-white rounded-lg border p-4 space-y-2`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {review.title && (
            <h4 className="text-sm font-medium truncate">{review.title}</h4>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {review.role && (
              <span className="text-xs text-muted-foreground">{review.role}</span>
            )}
            {review.location && (
              <span className="text-xs text-muted-foreground">
                &middot; {review.location}
              </span>
            )}
            {review.isCurrentEmployee !== null && (
              <span className="text-xs text-muted-foreground">
                &middot; {review.isCurrentEmployee ? "Current" : "Former"}
              </span>
            )}
            {date && (
              <span className="text-xs text-muted-foreground">&middot; {date}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.rating != null && <StarRating rating={review.rating} />}
          {badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {review.pros && (
          <div>
            <div className="text-xs font-medium text-green-700 mb-0.5">Pros</div>
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{review.pros}</p>
          </div>
        )}
        {review.cons && (
          <div>
            <div className="text-xs font-medium text-red-700 mb-0.5">Cons</div>
            <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{review.cons}</p>
          </div>
        )}
      </div>
    </div>
  );
}
