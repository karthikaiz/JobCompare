import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId || typeof reviewId !== "string" || reviewId.length > 50) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const review = await prisma.userReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Prevent self-upvoting
    if (review.userId === user.userId) {
      return NextResponse.json({ error: "Cannot upvote your own review" }, { status: 403 });
    }

    // Check if already upvoted (unique constraint will also catch this)
    const existing = await prisma.userReviewUpvote.findUnique({
      where: { userId_reviewId: { userId: user.userId, reviewId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already upvoted" }, { status: 409 });
    }

    // Use a transaction to atomically create upvote record + increment counter
    const updated = await prisma.$transaction(async (tx) => {
      await tx.userReviewUpvote.create({
        data: { userId: user.userId, reviewId },
      });
      return tx.userReview.update({
        where: { id: reviewId },
        data: { upvotes: { increment: 1 } },
      });
    });

    return NextResponse.json({ upvotes: updated.upvotes });
  } catch {
    return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
  }
}
