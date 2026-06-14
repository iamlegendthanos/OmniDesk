import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LANGUAGES } from "@/constants";
import { Moon, Sun, Globe, Bell, Shield, ChevronDown, LogOut, User, Target, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const PERSONA_OPTIONS = [
  {
    value: "finder" as const,
    label: "The Finder",
    desc: "No solid business idea yet — exploring passions and skills",
    emoji: "🔍",
  },
  {
    value: "grower" as const,
    label: "The Grower",
    desc: "Has a side hustle or early business — stuck in manual work",
    emoji: "🌱",
  },
  {
    value: "scaler" as const,
    label: "The Scaler",
    desc: "Established business — ready to optimise and scale operations",
    emoji: "🚀",
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { onboarding, saveOnboarding } = useOnboarding();
  const [language, setLanguage] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const [notifState, setNotifState] = useState({ email: true, browser: false, weekly: true });
  const [saved, setSaved] = useState(false);

  // Edit profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<"finder" | "grower" | "scaler" | "">(""); 
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync from loaded onboarding
  useEffect(() => {
    if (onboarding) {
      setSelectedPersona((onboarding.user_type as "finder" | "grower" | "scaler" | "") ?? "");
      setPrimaryGoal(onboarding.primary_goal ?? "");
    }
  }, [onboarding]);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleSave = () => {
    setSaved(true);
    toast.success("Preferences saved.");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleProfileSave = async () => {
    if (!selectedPersona) { toast.error("Please select a persona type."); return; }
    setSavingProfile(true);
    await saveOnboarding({
      user_type: selectedPersona,
      primary_goal: primaryGoal,
    });
    // Also update username if needed (via auth metadata)
    if (user) {
      await supabase.auth.updateUser({ data: { username: user.username } });
    }
    setEditingProfile(false);
    setSavingProfile(false);
    toast.success("Profile updated — AI context refreshed for your next chat.", { duration: 4000 });
  };

  const personaLabel = onboarding?.user_type
    ? PERSONA_OPTIONS.find((p) => p.value === onboarding.user_type)
    : null;

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">Preferences</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">Settings</h1>
        </div>

        {/* ── PROFILE ── */}
        <section className="mb-7 animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest">Profile</h2>
            <button
              onClick={() => setEditingProfile((e) => !e)}
              className="flex items-center gap-1.5 text-xs font-sans font-semibold text-foreground hover:opacity-70 transition-opacity"
            >
              <Pencil size={11} />
              {editingProfile ? "Cancel" : "Edit"}
            </button>
          </div>
          <div className="surface-card overflow-hidden">
            {/* Current profile info */}
            <div className="p-6 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-xl text-foreground flex-shrink-0"
                style={{ background: "hsl(var(--omni-warm))", border: "1px solid rgba(26,26,26,0.1)" }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-sans text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground font-sans">{user?.email}</p>
                {personaLabel && (
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-sans px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {personaLabel.emoji} {personaLabel.label}
                    {onboarding?.primary_goal && <> · <em className="not-italic opacity-70 truncate max-w-[120px]">{onboarding.primary_goal}</em></>}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs font-sans flex-shrink-0">
                <div className="px-3 py-2 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-muted-foreground text-[10px]">Plan</p>
                  <p className="text-foreground font-semibold">Free</p>
                </div>
                <div className="px-3 py-2 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-muted-foreground text-[10px]">Status</p>
                  <p className="text-omni-leaf font-semibold">Active</p>
                </div>
              </div>
            </div>

            {/* Edit Profile panel */}
            {editingProfile && (
              <div className="p-6 animate-fade-up" style={{ borderTop: "1px solid rgba(26,26,26,0.04)" }}>
                {/* Persona picker */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={13} strokeWidth={1.5} className="text-muted-foreground" />
                    <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wide">Business Persona</p>
                  </div>
                  <div className="space-y-2">
                    {PERSONA_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedPersona(opt.value)}
                        className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all ${
                          selectedPersona === opt.value
                            ? "bg-foreground text-background"
                            : "text-foreground hover:bg-muted"
                        }`}
                        style={{
                          borderRadius: "12px",
                          border: selectedPersona === opt.value
                            ? "none"
                            : "1px solid rgba(26,26,26,0.08)",
                        }}
                      >
                        <span className="text-lg flex-shrink-0">{opt.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold font-sans ${selectedPersona === opt.value ? "text-background" : "text-foreground"}`}>
                            {opt.label}
                          </p>
                          <p className={`text-xs font-sans leading-snug ${selectedPersona === opt.value ? "text-background/70" : "text-muted-foreground"}`}>
                            {opt.desc}
                          </p>
                        </div>
                        {selectedPersona === opt.value && <Check size={14} className="flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary goal */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={13} strokeWidth={1.5} className="text-muted-foreground" />
                    <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wide">Primary Goal</p>
                  </div>
                  <textarea
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    placeholder="e.g. Launch my handmade jewellery brand online and get to ₦500k/month within 6 months"
                    rows={3}
                    className="omni-input resize-none"
                    style={{ borderRadius: "12px" }}
                  />
                  <p className="text-[11px] text-muted-foreground font-sans mt-2 opacity-60">
                    This updates the AI context — your next chat session will use this goal automatically.
                  </p>
                </div>

                {/* Save button */}
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile || !selectedPersona}
                  className="btn-primary w-full py-3.5"
                  style={{ borderRadius: "12px" }}
                >
                  {savingProfile ? "Saving…" : "Save profile changes"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── APPEARANCE ── */}
        <section className="mb-7 animate-fade-up stagger-2">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Appearance</h2>
          <div className="surface-card overflow-hidden">
            {/* Theme switch row */}
            <div className="p-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  {theme === "dark" ? <Moon size={15} strokeWidth={1.5} /> : <Sun size={15} strokeWidth={1.5} />}
                </div>
                <div>
                  <p className="text-sm font-semibold font-sans text-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground font-sans">
                    {theme === "light" ? "Clean white workspace" : "Deep espresso workspace"}
                  </p>
                </div>
              </div>
              <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(26,26,26,0.10)" }}>
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-sans transition-all ${
                      theme === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "light" ? <Sun size={10} /> : <Moon size={10} />}
                    {t === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme previews */}
            <div className="p-4 grid grid-cols-2 gap-3">
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
                  }}
                >
                  <p className={`text-xs font-serif mb-2.5 pb-2.5 ${t === "dark" ? "border-b border-[#F5EFEB]/15" : "border-b border-[#1A1A1A]/10"}`}>OmniDesk</p>
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
        <section className="mb-7 animate-fade-up stagger-3">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Language</h2>
          <div className="surface-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Globe size={14} strokeWidth={1.5} />
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
        <section className="mb-7 animate-fade-up stagger-4">
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Bell size={13} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-sans text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-sans">{item.sub}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifState((n) => ({ ...n, [item.key]: !n[item.key] }))}
                  className={`relative w-10 h-5.5 transition-all flex-shrink-0 ${notifState[item.key] ? "bg-foreground" : "bg-muted"}`}
                  style={{ borderRadius: "50px", minWidth: "44px", minHeight: "24px" }}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-background transition-all`}
                    style={{
                      borderRadius: "50px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      left: notifState[item.key] ? "calc(100% - 22px)" : "2px",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRIVACY ── */}
        <section className="mb-8 animate-fade-up stagger-5">
          <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Privacy & Security</h2>
          <div className="surface-flat p-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={13} strokeWidth={1.5} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Integrations use OAuth — OmniDesk never stores raw credentials. Conversation data is encrypted and persisted to your private workspace only.
            </p>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up pb-6">
          <button onClick={handleSave} className="btn-pill px-8 py-4 flex-1 sm:flex-none">
            {saved ? "✓ Saved" : "Save preferences"}
          </button>
          <button
            onClick={logout}
            className="btn-ghost-pill px-6 py-4 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
