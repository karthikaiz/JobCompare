"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const isJobSeeker = pathname.startsWith("/job-seeker");
  const isRecruiter = pathname.startsWith("/recruiter");

  return (
    <nav className="border-b border-white/8 bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">
          Job<span className="gradient-text">Compare</span>
        </Link>

        {/* Role switcher — hidden on mobile */}
        <div className="hidden sm:flex items-center bg-white/5 border border-white/8 rounded-lg p-0.5 mx-auto">
          <Link
            href="/job-seeker"
            className={cn(
              "px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
              isJobSeeker
                ? "bg-[#0070F3]/15 text-[#0070F3] shadow-none"
                : "text-white/50 hover:text-white/80"
            )}
          >
            Job Seeker
          </Link>
          <Link
            href="/recruiter"
            className={cn(
              "px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
              isRecruiter
                ? "bg-[#0070F3]/15 text-[#0070F3] shadow-none"
                : "text-white/50 hover:text-white/80"
            )}
          >
            Recruiter
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 ml-auto">
          <ThemeToggle variant="light" />
          <Link href="/admin/registry" className="hidden sm:block">
            <span className="text-xs text-white/30 hover:text-white/60 transition-colors">Admin</span>
          </Link>
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-white/60 hidden sm:inline">
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
