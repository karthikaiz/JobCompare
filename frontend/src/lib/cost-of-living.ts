/**
 * Cost of Living Index — Indian Cities
 *
 * Bangalore = 100 (baseline). Indices represent relative cost of
 * living for a working professional (rent, food, transport, utilities).
 *
 * Derived from: Numbeo India City Cost of Living 2025,
 * NoBroker Rental Index Q1 2026, and Mercer Cost of Living Survey 2025.
 *
 * Reviewed: 2026-04-12. Next review: Q3 2026.
 */

export interface CityColData {
  index: number;           // Bangalore = 100 baseline
  rentIndex: number;       // Rent-only index (Bangalore = 100)
  currency: "INR";
  notes: string;
}

export const COST_OF_LIVING: Record<string, CityColData> = {
  "Bangalore": {
    index: 100,
    rentIndex: 100,
    currency: "INR",
    notes: "Baseline city. High rent (Koramangala/Indiranagar) and dining costs, offset by strong salary market.",
  },
  "Mumbai": {
    index: 112,
    rentIndex: 130,
    currency: "INR",
    notes: "Highest rent in India (BKC/Andheri). Food and transport also expensive. Premium offset needed.",
  },
  "Delhi NCR": {
    index: 95,
    rentIndex: 90,
    currency: "INR",
    notes: "Includes Gurgaon/Noida. Rent lower than Bangalore; food and transport costs moderate.",
  },
  "Hyderabad": {
    index: 82,
    rentIndex: 72,
    currency: "INR",
    notes: "Significantly cheaper than Bangalore. HITEC City apartments 30–40% cheaper than Koramangala equivalent.",
  },
  "Pune": {
    index: 80,
    rentIndex: 70,
    currency: "INR",
    notes: "Most affordable major IT city. Hinjewadi/Kharadi rentals well below Bangalore.",
  },
  "Chennai": {
    index: 83,
    rentIndex: 74,
    currency: "INR",
    notes: "Moderate cost. OMR corridor affordable; city centre costs higher. Lower food costs than Bangalore.",
  },
  "Kolkata": {
    index: 68,
    rentIndex: 55,
    currency: "INR",
    notes: "Lowest cost among major metros. Salt Lake/New Town significantly cheaper than Bangalore.",
  },
  "Ahmedabad": {
    index: 65,
    rentIndex: 52,
    currency: "INR",
    notes: "Lowest cost among top 9 cities. Prahlad Nagar/SG Highway rentals very affordable.",
  },
  "Remote": {
    index: 75,
    rentIndex: 60,
    currency: "INR",
    notes: "Estimated average assuming tier-2 city or home town. Actual COL varies significantly by location.",
  },
};

/**
 * Returns the COL-adjusted effective salary.
 * A salary in city X is worth salary * (100 / cityIndex) in Bangalore terms.
 *
 * Example: 20L in Hyderabad (82) = 20 * (100/82) = 24.4L Bangalore equivalent
 */
export function toBaselineSalary(salary: number, city: string): number {
  const col = COST_OF_LIVING[city];
  if (!col) return salary;
  return salary * (100 / col.index);
}

/**
 * Returns the purchasing power ratio between two cities.
 * ratio > 1 means offerCity has better purchasing power than baseCity.
 *
 * Example: compareColAdjusted(18, "Hyderabad", 20, "Bangalore") -> offer ratio ~1.10
 */
export function compareColAdjusted(
  salaryA: number, cityA: string,
  salaryB: number, cityB: string
): { ratioAtoB: number; adjustedA: number; adjustedB: number } {
  const adjustedA = toBaselineSalary(salaryA, cityA);
  const adjustedB = toBaselineSalary(salaryB, cityB);
  return {
    ratioAtoB: adjustedA / adjustedB,
    adjustedA,
    adjustedB,
  };
}

export const CITY_NAMES = Object.keys(COST_OF_LIVING);
