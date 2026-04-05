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

const SENTIMENT_CONFIG = {
  positive: {
    border: "border-l-[#4A7C59]",
    badge: "bg-[#4A7C59]/10 text-[#4A7C59] border border-[#4A7C59]/30",
    label: "Positive",
  },
  negative: {
    border: "border-l-[#B05252]",
    badge: "bg-[#B05252]/10 text-[#B05252] border border-[#B05252]/30",
    label: "Negative",
  },
  neutral: {
    border: "border-l-[#8B8070]",
    badge: "bg-[#8B8070]/10 text-[#8B8070] border border-[#8B8070]/25",
    label: "Neutral",
  },
} as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? "text-[#C4714A]" : "text-ink/15"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  if (!review.pros?.trim() && !review.cons?.trim()) return null;

  const config = review.sentiment ? SENTIMENT_CONFIG[review.sentiment as keyof typeof SENTIMENT_CONFIG] : null;
  const borderClass = config?.border ?? "border-l-ink/20";

  const date = review.reviewDate
    ? new Date(review.reviewDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : null;

  const showTitle = review.title && !/^rated by/i.test(review.title);

  return (
    <div className={`border-l-[3px] ${borderClass} bg-white border border-ink/15 overflow-hidden`}>
      {/* ── Header row ── */}
      <div className="px-4 pt-3 pb-2 flex flex-wrap items-start justify-between gap-2 border-b border-ink/8">
        <div className="flex-1 min-w-0">
          {showTitle && (
            <p className="font-serif font-semibold text-ink text-sm leading-snug mb-0.5 truncate">
              {review.title}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6b6559] font-sans">
            {review.role && <span className="font-medium text-ink/70">{review.role}</span>}
            {review.location && <span>· {review.location}</span>}
            {review.isCurrentEmployee !== null && (
              <span>· {review.isCurrentEmployee ? "Current" : "Former"}</span>
            )}
            {date && <span>· {date}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {review.rating != null && <StarRating rating={review.rating} />}
          {config && (
            <span className={`text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 font-sans font-medium ${config.badge}`}>
              {config.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Pros & Cons ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/8">
        {review.pros?.trim() && (
          <div className="px-4 py-3 bg-[#F5FBF5]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-3 h-px bg-[#4A7C59]" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#4A7C59] font-sans font-semibold">Pros</span>
            </div>
            <p className="text-[12px] text-ink/80 leading-relaxed font-sans line-clamp-4">
              {review.pros}
            </p>
          </div>
        )}
        {review.cons?.trim() && (
          <div className="px-4 py-3 bg-[#FDF5F5]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-3 h-px bg-[#B05252]" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#B05252] font-sans font-semibold">Cons</span>
            </div>
            <p className="text-[12px] text-ink/80 leading-relaxed font-sans line-clamp-4">
              {review.cons}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
