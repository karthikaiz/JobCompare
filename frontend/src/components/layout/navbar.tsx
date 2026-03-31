"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const isJobSeeker = pathname.startsWith("/job-seeker");
  const isRecruiter = pathname.startsWith("/recruiter");

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Job<span className="text-blue-600">Compare</span>
          </Link>

          {/* Role switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <Link
              href="/job-seeker"
              className={cn(
                "px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors",
                isJobSeeker
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Job Seeker
            </Link>
            <Link
              href="/recruiter"
              className={cn(
                "px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors",
                isRecruiter
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Recruiter
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/admin/registry">
            <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Admin</span>
          </Link>
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout} className="text-xs h-8">
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Sign In
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
