"use client";

import { Badge } from "@/components/ui/badge";

interface Benefit {
  category: string;
  name: string;
  details?: string | null;
}

interface BenefitsBadgesProps {
  benefits: Benefit[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "health & insurance": "bg-red-500/15 text-red-400 border-red-500/25",
  "health insurance": "bg-red-500/15 text-red-400 border-red-500/25",
  "insurance": "bg-red-500/15 text-red-400 border-red-500/25",
  "leaves & holidays": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "leaves": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "work-life balance": "bg-[#0070F3]/15 text-[#0070F3] border-[#0070F3]/25",
  "work from home": "bg-[#0070F3]/15 text-[#0070F3] border-[#0070F3]/25",
  "wfh": "bg-[#0070F3]/15 text-[#0070F3] border-[#0070F3]/25",
  "food & drinks": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "food": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "cafeteria": "bg-orange-500/15 text-orange-400 border-orange-500/25",
  "transport": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "cab": "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "financial": "bg-[#00A6FF]/15 text-[#00A6FF] border-[#00A6FF]/25",
  "retirement": "bg-[#00A6FF]/15 text-[#00A6FF] border-[#00A6FF]/25",
  "learning & development": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  "education": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  "perks": "bg-pink-500/15 text-pink-400 border-pink-500/25",
  "wellness": "bg-teal-500/15 text-teal-400 border-teal-500/25",
  "gym": "bg-teal-500/15 text-teal-400 border-teal-500/25",
};

function getCategoryColor(category: string): string {
  const lower = category.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return value;
  }
  return "bg-white/10 text-white/70 border-white/10";
}

export function BenefitsBadges({ benefits }: BenefitsBadgesProps) {
  if (benefits.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No benefits data available</p>;
  }

  // Group by category
  const grouped: Record<string, Benefit[]> = {};
  for (const b of benefits) {
    const cat = b.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">
            {category}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((b, i) => (
              <Badge
                key={i}
                variant="outline"
                className={`text-xs font-normal ${getCategoryColor(category)}`}
              >
                {b.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
