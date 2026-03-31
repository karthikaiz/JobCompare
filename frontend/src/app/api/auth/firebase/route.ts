import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, tokenCookieOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

interface FirebaseTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  exp: number;
}

async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload | null> {
  try {
    // Fetch Google's public keys for Firebase
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } }
    );
    const certs = await res.json();

    // Decode header to find the key ID
    const [headerB64] = idToken.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const cert = certs[header.kid];
    if (!cert) return null;

    // Import the certificate and verify
    const { importX509, jwtVerify } = await import("jose");
    const publicKey = await importX509(cert, "RS256");
    const { payload } = await jwtVerify(idToken, publicKey, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    // Validate payload structure
    if (!payload.sub || typeof payload.sub !== "string") return null;
    if (payload.email && typeof payload.email !== "string") return null;

    return {
      iss: String(payload.iss),
      aud: String(payload.aud),
      sub: String(payload.sub),
      email: payload.email ? String(payload.email) : undefined,
      name: payload.name ? String(payload.name) : undefined,
      email_verified: payload.email_verified === true,
      exp: Number(payload.exp),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limited = checkRateLimit(`firebase:${ip}`, 20, 15 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    const payload = await verifyFirebaseToken(idToken);
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || email.split("@")[0];

    // Find or create user — links to existing email/password user if email matches
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-create user on first Google sign-in
      // Use a random hash since they won't use password login
      const randomHash = `firebase:${payload.sub}`;
      user = await prisma.user.create({
        data: {
          email,
          displayName: String(displayName).slice(0, 100),
          passwordHash: randomHash,
          isEmailVerified: payload.email_verified === true,
        },
      });
    } else if (!user.displayName && displayName) {
      // Fill in display name if missing
      user = await prisma.user.update({
        where: { id: user.id },
        data: { displayName: String(displayName).slice(0, 100) },
      });
    }

    const token = await createToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
    response.cookies.set(tokenCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
