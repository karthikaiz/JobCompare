import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, tokenCookieOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// 10 login attempts per email per 15 minutes
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const emailStr = String(email).trim().toLowerCase().slice(0, 255);
    const passwordStr = String(password);

    // Rate limit by email to prevent brute force
    const limited = await checkRateLimit(`login:${emailStr}`, LOGIN_LIMIT, LOGIN_WINDOW);
    if (limited) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: emailStr } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Skip password check for Firebase-created accounts (no real password hash)
    if (user.passwordHash.startsWith("firebase:")) {
      return NextResponse.json({ error: "Please sign in with Google" }, { status: 401 });
    }

    const valid = await verifyPassword(passwordStr, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
    response.cookies.set(tokenCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
