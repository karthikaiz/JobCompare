"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { CompareBar } from "@/components/compare-bar";
import { useCompare } from "@/context/compare-context";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  role: "job-seeker" | "recruiter";
  children: React.ReactNode;
}

function MobileNav({ role }: { role: "job-seeker" | "recruiter" }) {
  const pathname = usePathname();
  const items = role === "job-seeker"
    ? [
        { href: "/job-seeker", label: "Dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
        { href: "/job-seeker/compare", label: "Compare", icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" },
      ]
    : [
        { href: "/recruiter", label: "Dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t">
      <div className="flex justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 text-xs min-h-[48px] justify-center",
                isActive ? "text-blue-600" : "text-gray-500"
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  const { companies } = useCompare();
  const hasCompareBar = role === "job-seeker" && companies.length > 0;

  // Mobile: 48px mobile nav + 56px compare bar (if present) = 104px max
  // Desktop: no mobile nav, just compare bar ~56px if present
  const bottomPadding = hasCompareBar
    ? "pb-[108px] md:pb-[72px]"  // mobile nav + compare bar | desktop: just compare bar
    : "pb-[56px] md:pb-6";       // mobile nav only | desktop: normal

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar role={role} />
        <main className={`flex-1 p-4 sm:p-6 ${bottomPadding} bg-gray-50/30`}>
          {children}
        </main>
      </div>
      {/* Compare bar sits above mobile nav */}
      {role === "job-seeker" && <CompareBar />}
      <MobileNav role={role} />
    </div>
  );
}
