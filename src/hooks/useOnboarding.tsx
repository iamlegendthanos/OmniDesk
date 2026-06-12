import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { UserOnboarding } from "@/types";

export function useOnboarding() {
  const { user } = useAuth();
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        setOnboarding({ user_id: user.id, onboarding_complete: false } as UserOnboarding);
      } else {
        setOnboarding(data as UserOnboarding);
      }
      setLoading(false);
    })();
  }, [user]);

  const saveOnboarding = useCallback(async (data: Partial<UserOnboarding>) => {
    if (!user) return null;

    const payload = {
      ...data,
      user_id: user.id,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    // Check if a record already exists
    const { data: existing } = await supabase
      .from("user_onboarding")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let result: UserOnboarding | null = null;

    if (existing?.id) {
      // Update the existing record by primary key
      const { data: updated, error } = await supabase
        .from("user_onboarding")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) console.error("saveOnboarding update error:", error);
      result = updated as UserOnboarding | null;
    } else {
      // Insert a new record
      const { data: inserted, error } = await supabase
        .from("user_onboarding")
        .insert(payload)
        .select()
        .single();
      if (error) console.error("saveOnboarding insert error:", error);
      result = inserted as UserOnboarding | null;
    }

    if (result) setOnboarding(result);
    setShowModal(false);
    return result;
  }, [user]);

  return { onboarding, loading, showModal, setShowModal, saveOnboarding };
}
