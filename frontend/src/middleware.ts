import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Block /admin entirely on production (Vercel)
  // Only accessible on localhost (development)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
