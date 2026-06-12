import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { AuthUser } from "@/types";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (u: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: () => {}, logout: async () => {},
});

function mapUser(u: User): AuthUser {
  return {
    id: u.id,
    email: u.email!,
    username: u.user_metadata?.username || u.user_metadata?.full_name || u.email!.split("@")[0],
    avatar: u.user_metadata?.avatar_url,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((u: AuthUser) => setUser(u), []);
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) login(mapUser(session.user));
      if (mounted) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) { login(mapUser(session.user)); setLoading(false); }
      else if (event === "SIGNED_OUT") { setUser(null); setLoading(false); }
      else if (event === "TOKEN_REFRESHED" && session?.user) login(mapUser(session.user));
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
export { mapUser };
