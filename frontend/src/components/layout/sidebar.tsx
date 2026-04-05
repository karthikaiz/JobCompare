"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "job-seeker" | "recruiter";
}

const JOB_SEEKER_NAV = [
  { href: "/job-seeker", label: "Dashboard", icon: "grid" },
  { href: "/job-seeker/compare", label: "Compare", icon: "columns" },
];

const RECRUITER_NAV = [
  { href: "/recruiter", label: "Dashboard", icon: "grid" },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  grid: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  columns: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
    </svg>
  ),
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "job-seeker" ? JOB_SEEKER_NAV : RECRUITER_NAV;

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-white/8 bg-[#0d0d0d] p-4 gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-[#0070F3]/10 text-[#0070F3] border-l-2 border-[#0070F3] pl-[10px]"
                : "text-white/50 hover:bg-white/8 hover:text-white/80 border border-transparent"
            )}
          >
            {ICON_MAP[item.icon]}
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
