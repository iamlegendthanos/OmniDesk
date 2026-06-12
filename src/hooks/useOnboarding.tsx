import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { UserOnboarding } from "@/types";

export function useOnboarding() {
  const { user } = useAuth();
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null);
  const [loading, setLoading] = useState(true);
  // Legacy: keep showModal for AppLayout compat (unused now — triage is a full page)
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
        // No record yet — treat as incomplete
        setOnboarding({ user_id: user.id, onboarding_complete: false });
      } else {
        setOnboarding(data as UserOnboarding);
      }
      setLoading(false);
    })();
  }, [user]);

  const saveOnboarding = useCallback(async (data: Partial<UserOnboarding>) => {
    if (!user) return;
    const payload = {
      ...data,
      user_id: user.id,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };
    const { data: result } = await supabase
      .from("user_onboarding")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (result) setOnboarding(result as UserOnboarding);
    setShowModal(false);
  }, [user]);

  return { onboarding, loading, showModal, setShowModal, saveOnboarding };
}
