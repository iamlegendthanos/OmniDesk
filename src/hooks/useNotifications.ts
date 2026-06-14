import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  type: "bloom_trigger" | "roadmap_completion" | "integration_change" | "ai_recommendation";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user]);

  // Poll every 12 seconds for real-time feel
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 12000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, fetchNotifications]);

  const addNotification = useCallback(async (
    type: Notification["type"],
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .insert({ user_id: user.id, type, title, message, metadata: metadata ?? {}, read: false })
      .select()
      .single();
    if (data) setNotifications((prev) => [data as Notification, ...prev]);
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, addNotification, markRead, markAllRead, clearAll, refetch: fetchNotifications };
}
