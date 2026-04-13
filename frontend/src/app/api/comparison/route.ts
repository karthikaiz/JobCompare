import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/comparison — create a shareable snapshot
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slugs, names } = body as { slugs: string[]; names: string[] };

  if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 3) {
    return NextResponse.json({ error: "Need 2–3 company slugs" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const snapshot = await prisma.comparisonSnapshot.create({
    data: {
      slugs: JSON.stringify(slugs),
      names: JSON.stringify(names ?? slugs),
      expiresAt,
    },
  });

  return NextResponse.json({ id: snapshot.id });
}
