import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MAX_WATCHLIST = 20;

// GET /api/watchlist — list user's watchlisted companies
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.watchlist.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      company: {
        select: {
          slug: true,
          name: true,
          industry: true,
          overallRating: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: items.map((w) => ({
      slug: w.company.slug,
      name: w.company.name,
      industry: w.company.industry,
      overallRating: w.company.overallRating,
      addedAt: w.createdAt.toISOString(),
    })),
  });
}

// POST /api/watchlist — add a company { slug }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  // Check limit
  const count = await prisma.watchlist.count({ where: { userId: user.userId } });
  if (count >= MAX_WATCHLIST) {
    return NextResponse.json({ error: `Maximum ${MAX_WATCHLIST} bookmarks allowed` }, { status: 400 });
  }

  // Upsert (idempotent)
  await prisma.watchlist.upsert({
    where: { userId_companyId: { userId: user.userId, companyId: company.id } },
    create: { userId: user.userId, companyId: company.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/watchlist — remove a company { slug }
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  await prisma.watchlist.deleteMany({
    where: { userId: user.userId, companyId: company.id },
  });

  return NextResponse.json({ ok: true });
}
