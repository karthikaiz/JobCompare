import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, tokenCookieOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// 5 registrations per IP per hour
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limited = await checkRateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW);
    if (limited) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const emailStr = String(email).trim().toLowerCase().slice(0, 255);
    const passwordStr = String(password);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (passwordStr.length < 8 || passwordStr.length > 128) {
      return NextResponse.json({ error: "Password must be 8-128 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: emailStr } });
    if (existing) {
      // Don't reveal that the email exists — prevent enumeration
      return NextResponse.json({ error: "Registration failed. Please try a different email or sign in." }, { status: 400 });
    }

    const passwordHash = await hashPassword(passwordStr);

    const user = await prisma.user.create({
      data: {
        email: emailStr,
        passwordHash,
        displayName: displayName ? String(displayName).trim().slice(0, 100) : null,
      },
    });

    const token = await createToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
    response.cookies.set(tokenCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
