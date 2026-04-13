import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const snapshot = await prisma.comparisonSnapshot.findUnique({ where: { id } });

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  if (snapshot.expiresAt < new Date()) {
    return NextResponse.json({ error: "This comparison link has expired" }, { status: 410 });
  }

  return NextResponse.json({
    id: snapshot.id,
    slugs: JSON.parse(snapshot.slugs),
    names: JSON.parse(snapshot.names),
    createdAt: snapshot.createdAt,
    expiresAt: snapshot.expiresAt,
  });
}
