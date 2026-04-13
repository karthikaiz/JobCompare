"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompare } from "@/context/compare-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { motion } from "framer-motion";

export default function SharedComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addCompany } = useCompare();

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/comparison/${id}`);
      if (!res.ok) return; // handled by render below via redirect
      const data = await res.json();

      if (data.error) return;

      const slugs: string[] = data.slugs;
      const names: string[] = data.names;

      // Add each company to compare context
      slugs.forEach((slug, i) => {
        addCompany({ slug, name: names[i] ?? slug });
      });

      // Redirect to the compare page which will now have these companies loaded
      router.replace("/job-seeker/compare");
    }

    load();
  }, [id, addCompany, router]);

  return (
    <DashboardShell role="job-seeker">
      <div className="bg-cream min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-3"
        >
          <div className="w-8 h-8 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin mx-auto" />
          <p className="text-sm text-warmgray font-sans">Loading shared comparison...</p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
