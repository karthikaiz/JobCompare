"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

interface WatchlistItem {
  slug: string;
  name: string;
  industry: string | null;
  overallRating: number | null;
  addedAt: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [slugSet, setSlugSet] = useState<Set<string>>(new Set());

  const fetchWatchlist = useCallback(async () => {
    if (!user) { setItems([]); setSlugSet(new Set()); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setSlugSet(new Set(data.items.map((i: WatchlistItem) => i.slug)));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  const isWatchlisted = useCallback((slug: string) => slugSet.has(slug), [slugSet]);

  const toggle = useCallback(async (slug: string) => {
    if (!user) return;
    const wasWatchlisted = slugSet.has(slug);
    const method = wasWatchlisted ? "DELETE" : "POST";

    // Optimistic update
    if (wasWatchlisted) {
      setItems((prev) => prev.filter((i) => i.slug !== slug));
      setSlugSet((prev) => { const next = new Set(prev); next.delete(slug); return next; });
    } else {
      setSlugSet((prev) => new Set(prev).add(slug));
    }

    try {
      const res = await fetch("/api/watchlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchWatchlist();
      } else if (!wasWatchlisted) {
        // Refetch to get full item data
        fetchWatchlist();
      }
    } catch {
      fetchWatchlist();
    }
  }, [user, slugSet, fetchWatchlist]);

  return { items, loading, isWatchlisted, toggle };
}
