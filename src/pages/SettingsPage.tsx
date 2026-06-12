import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGES } from "@/constants";
import { Moon, Sun, Globe, Bell, Shield, ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, browser: false, weekly: true });
  const [saved, setSaved] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleSave = () => {
    setSaved(true);
    toast.success("Preferences saved.");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-xl">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">Preferences</p>
          <h1 className="font-serif text-5xl text-foreground">Settings</h1>
        </div>

        {/* ── APPEARANCE ── */}
        <section className="mb-8 animate-fade-up stagger-1">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Appearance</h2>
          <div className="surface-card overflow-hidden">
            {/* Theme switch row */}
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  {theme === "dark" ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
                </div>
                <div>
                  <p className="text-sm font-semibold font-sans text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {theme === "light" ? "Light — clean white workspace" : "Espresso — deep dark workspace"}
                  </p>
                </div>
              </div>
              <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(26,26,26,0.10)" }}>
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-sans transition-all ${
                      theme === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "light" ? <Sun size={11} /> : <Moon size={11} />}
                    {t === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme previews */}
            <div className="p-5 grid grid-cols-2 gap-3">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 text-left transition-all ${
                    t === "dark" ? "bg-[#12100E] text-[#F5EFEB]" : "bg-white text-[#1A1A1A]"
                  }`}
                  style={{
                    borderRadius: "14px",
                    border: theme === t ? "2px solid hsl(var(--foreground))" : "2px solid rgba(26,26,26,0.08)",
                    boxShadow: theme === t ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <p className={`text-xs font-serif mb-2.5 pb-2.5 ${t === "dark" ? "border-b border-[#F5EFEB]/15" : "border-b border-[#1A1A1A]/10"}`}>
                    OmniDesk
                  </p>
                  <div className={`h-1.5 rounded-full w-3/4 mb-2 ${t === "dark" ? "bg-[#2C2520]" : "bg-[#F5EFEB]"}`} />
                  <div className={`h-1 rounded-full w-1/2 ${t === "dark" ? "bg-[#2C2520]" : "bg-[#F5EFEB]"}`} />
                  <p className={`text-[10px] font-sans mt-3 ${t === "dark" ? "text-[#F5EFEB]/40" : "text-[#1A1A1A]/40"}`}>
                    {t === "light" ? "Light · #FFFFFF" : "Espresso · #12100E"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── LANGUAGE ── */}
        <section className="mb-8 animate-fade-up stagger-2">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Language</h2>
          <div className="surface-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Globe size={15} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold font-sans text-foreground">Display Language</p>
                <p className="text-xs text-muted-foreground font-sans">Currently: {currentLang.nativeLabel}</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-sans text-foreground hover:bg-muted transition-colors"
                style={{ borderRadius: "12px", border: "1px solid rgba(26,26,26,0.10)" }}
              >
                <span>{currentLang.nativeLabel} ({currentLang.label})</span>
                <ChevronDown size={13} className={`text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div
                  className="absolute top-full left-0 right-0 bg-background z-20 mt-2 max-h-52 overflow-y-auto shadow-float animate-fade-up"
                  style={{ borderRadius: "12px", border: "1px solid rgba(26,26,26,0.10)" }}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-sm font-sans hover:bg-muted transition-colors flex justify-between items-center ${
                        language === lang.code ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-xs opacity-50">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── NOTIFICATIONS ── */}
        <section className="mb-8 animate-fade-up stagger-3">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Notifications</h2>
          <div className="surface-card overflow-hidden">
            {([
              { key: "email" as const, label: "Email notifications", sub: "Roadmap updates and bloom events" },
              { key: "browser" as const, label: "Browser notifications", sub: "Real-time automation alerts" },
              { key: "weekly" as const, label: "Weekly digest", sub: "Summary of your business growth" },
            ]).map((item, i, arr) => (
              <div
                key={item.key}
                className="p-5 flex items-center justify-between"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(26,26,26,0.06)" : "none" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <Bell size={13} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-sans text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-sans">{item.sub}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, [item.key]: !n[item.key] }))}
                  className={`relative w-11 h-6 transition-all flex-shrink-0 ${notifications[item.key] ? "bg-foreground" : "bg-muted"}`}
                  style={{ borderRadius: "50px" }}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-background transition-all ${notifications[item.key] ? "left-[22px]" : "left-0.5"}`}
                    style={{ borderRadius: "50px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROFILE ── */}
        <section className="mb-8 animate-fade-up stagger-4">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Profile</h2>
          <div className="surface-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-xl text-foreground"
                style={{ background: "hsl(var(--omni-warm))", border: "1px solid rgba(26,26,26,0.1)" }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold font-sans text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground font-sans">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-muted-foreground mb-1">Account type</p>
                <p className="text-foreground font-semibold">OmniDesk Free</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-muted-foreground mb-1">Status</p>
                <p className="text-omni-leaf font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-omni-leaf" />Active
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRIVACY ── */}
        <section className="mb-10 animate-fade-up stagger-5">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Privacy</h2>
          <div className="surface-flat p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={14} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Integrations use OAuth — OmniDesk never stores raw credentials. Your conversation data is encrypted and persisted to your private workspace only.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-4 animate-fade-up">
          <button onClick={handleSave} className="btn-pill px-10 py-4">
            {saved ? "✓ Saved" : "Save preferences"}
          </button>
          <button
            onClick={logout}
            className="btn-ghost-pill px-6 py-4 flex items-center gap-2 text-sm"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
