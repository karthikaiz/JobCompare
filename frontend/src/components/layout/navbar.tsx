"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const isJobSeeker = pathname.startsWith("/job-seeker");
  const isRecruiter = pathname.startsWith("/recruiter");

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Job<span className="text-blue-600">Compare</span>
          </Link>

          {/* Role switcher — visible on all screen sizes */}
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

        <div className="flex items-center gap-2">
          <Link href="/admin/registry">
            <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
