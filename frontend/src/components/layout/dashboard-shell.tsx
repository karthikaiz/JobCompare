"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CompareBar } from "@/components/compare-bar";
import { useCompare } from "@/context/compare-context";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  role: "job-seeker" | "recruiter";
  children: React.ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  useCompare();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const isJobSeeker = pathname.startsWith("/job-seeker");
  const isRecruiter = pathname.startsWith("/recruiter");

  const navItems =
    role === "job-seeker"
      ? [
          { href: "/job-seeker", label: "Dashboard" },
          { href: "/job-seeker/compare", label: "Compare" },
        ]
      : [{ href: "/recruiter", label: "Dashboard" }];

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* h-11 top bar */}
      <header className="h-11 border-b-2 border-ink/20 bg-cream sticky top-0 z-50 flex items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="font-serif font-bold text-ink text-base tracking-tight whitespace-nowrap mr-2">
          Job<span className="text-terracotta">Compare</span>
        </Link>

        <span className="w-px h-4 bg-ink/20 hidden sm:block" />

        {/* Role switcher */}
        <div className="flex items-center border border-ink/20 overflow-hidden">
          <Link
            href="/job-seeker"
            className={cn(
              "px-3 py-1 text-[10px] uppercase tracking-[0.1em] font-sans font-medium transition-all whitespace-nowrap",
              isJobSeeker
                ? "bg-terracotta text-white"
                : "text-warmgray hover:text-ink hover:bg-ink/5"
            )}
          >
            Job Seeker
          </Link>
          <span className="w-px h-4 bg-ink/15" />
          <Link
            href="/recruiter"
            className={cn(
              "px-3 py-1 text-[10px] uppercase tracking-[0.1em] font-sans font-medium transition-all whitespace-nowrap",
              isRecruiter
                ? "bg-terracotta text-white"
                : "text-warmgray hover:text-ink hover:bg-ink/5"
            )}
          >
            Recruiter
          </Link>
        </div>

        {/* Page nav */}
        <nav className="hidden sm:flex items-center gap-1 ml-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-2.5 py-1 text-xs font-sans transition-all",
                pathname === item.href
                  ? "text-ink font-medium"
                  : "text-warmgray hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth — pushed to the right */}
        <div className="ml-auto flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <>
                  <span className="text-xs text-warmgray hidden sm:inline font-sans">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-xs uppercase tracking-[0.1em] border border-ink text-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors font-sans"
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname.split("?")[0]}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {role === "job-seeker" && <CompareBar />}

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-cream border-t-2 border-ink/20">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-sans min-h-[48px] justify-center transition-colors",
                  isActive ? "text-terracotta font-medium" : "text-warmgray hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
