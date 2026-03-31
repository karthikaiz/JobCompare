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
  "health & insurance": "bg-red-100 text-red-700 border-red-200",
  "health insurance": "bg-red-100 text-red-700 border-red-200",
  "insurance": "bg-red-100 text-red-700 border-red-200",
  "leaves & holidays": "bg-green-100 text-green-700 border-green-200",
  "leaves": "bg-green-100 text-green-700 border-green-200",
  "work-life balance": "bg-blue-100 text-blue-700 border-blue-200",
  "work from home": "bg-blue-100 text-blue-700 border-blue-200",
  "wfh": "bg-blue-100 text-blue-700 border-blue-200",
  "food & drinks": "bg-orange-100 text-orange-700 border-orange-200",
  "food": "bg-orange-100 text-orange-700 border-orange-200",
  "cafeteria": "bg-orange-100 text-orange-700 border-orange-200",
  "transport": "bg-purple-100 text-purple-700 border-purple-200",
  "cab": "bg-purple-100 text-purple-700 border-purple-200",
  "financial": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "retirement": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "learning & development": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "education": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "perks": "bg-pink-100 text-pink-700 border-pink-200",
  "wellness": "bg-teal-100 text-teal-700 border-teal-200",
  "gym": "bg-teal-100 text-teal-700 border-teal-200",
};

function getCategoryColor(category: string): string {
  const lower = category.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return value;
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
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
