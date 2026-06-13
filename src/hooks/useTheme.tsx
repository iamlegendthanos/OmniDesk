import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Theme } from "@/types";

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: "dark", setTheme: () => {}, toggle: () => {} });

/* Synchronously apply theme to DOM — avoids FOUC */
function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

/* Get initial theme — default is dark */
function getInitialTheme(): Theme {
  const stored = localStorage.getItem("omni-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark"; // default dark
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("omni-theme", theme);
  }, [theme]);

  // On mount, check if there's an authenticated session and load their DB preference
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("theme")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.theme && (data.theme === "light" || data.theme === "dark")) {
        setThemeState(data.theme as Theme);
      }
    });
  }, []);

  // Persist theme to DB with debounce (avoid rapid writes on toggle spam)
  const persistTheme = useCallback(async (t: Theme) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase
      .from("user_profiles")
      .update({ theme: t })
      .eq("id", session.user.id);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistTheme(t), 600);
  }, [persistTheme]);

  const toggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
