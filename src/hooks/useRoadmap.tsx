import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { RoadmapItem } from "@/types";
import { SAMPLE_ROADMAP } from "@/constants";

export function useRoadmap() {
  const { user } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("roadmap_items")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order");

    if (data && data.length > 0) {
      setItems(data as RoadmapItem[]);
    } else {
      const toInsert = SAMPLE_ROADMAP.map((r) => ({ ...r, user_id: user.id }));
      const { data: inserted } = await supabase.from("roadmap_items").insert(toInsert).select();
      if (inserted) setItems(inserted as RoadmapItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = useCallback(async (id: string, status: RoadmapItem["status"]) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    await supabase.from("roadmap_items").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  }, []);

  return { items, loading, updateStatus, refetch: fetch };
}
