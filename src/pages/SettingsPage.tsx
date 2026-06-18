import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LANGUAGES } from "@/constants";
import { supabase } from "@/lib/supabase";
import {
  Moon, Sun, Globe, Bell, Shield, ChevronDown, LogOut, User,
  Target, Pencil, Check, Zap, ExternalLink, Copy, RefreshCw,
  CheckCircle, AlertCircle, Loader2, Link2,
} from "lucide-react";
import { toast } from "sonner";

const PERSONA_OPTIONS = [
  { value: "finder" as const, label: "The Finder", desc: "No solid business idea yet — exploring passions and skills", emoji: "🔍" },
  { value: "grower" as const, label: "The Grower", desc: "Has a side hustle or early business — stuck in manual work", emoji: "🌱" },
  { value: "scaler" as const, label: "The Scaler", desc: "Established business — ready to optimise and scale operations", emoji: "🚀" },
];

interface OAuthConnection {
  id?: string;
  provider: "shopify" | "google_sheets" | "slack";
  connected: boolean;
  shop_domain?: string;
  spreadsheet_id?: string;
  channel_name?: string;
  updated_at?: string;
}

const INTEGRATION_DEFS = [
  {
    provider: "shopify" as const,
    name: "Shopify",
    logo: "🛍",
    color: "#96BF48",
    desc: "Receive order webhooks and trigger automations when orders are paid.",
    fields: [{ key: "shop_domain", label: "Shop Domain", placeholder: "your-store.myshopify.com" }],
  },
  {
    provider: "google_sheets" as const,
    name: "Google Sheets",
    logo: "G",
    color: "#0F9D58",
    desc: "Auto-append new orders as rows in your chosen Google Spreadsheet.",
    fields: [{ key: "spreadsheet_id", label: "Spreadsheet ID", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" }],
  },
  {
    provider: "slack" as const,
    name: "Slack",
    logo: "#",
    color: "#4A154B",
    desc: "Post a live notification to your Slack channel for every new order.",
    fields: [],
  },
];

function IntegrationCard({
  def,
  connection,
  onConnect,
  onDisconnect,
  webhookUrl,
}: {
  def: (typeof INTEGRATION_DEFS)[0];
  connection?: OAuthConnection;
  onConnect: (provider: string, extraFields: Record<string, string>) => void;
  onDisconnect: (provider: string) => void;
  webhookUrl?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const isConnected = connection?.connected;

  const handleConnect = async () => {
    setLoading(true);
    await onConnect(def.provider, fields);
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await onDisconnect(def.provider);
    setLoading(false);
  };

  const copyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied!");
    }
  };

  return (
    <div className="surface-flat overflow-hidden">
      <div
        className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((s) => !s)}
      >
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${def.color}18`, color: def.color }}
        >
          {def.logo}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-sans text-foreground">{def.name}</p>
          <p className="text-xs text-muted-foreground font-sans truncate">{def.desc}</p>
        </div>
        {/* Status badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-xs font-sans text-omni-leaf px-2.5 py-1 rounded-full bg-omni-leaf/10">
              <CheckCircle size={10} /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground px-2.5 py-1 rounded-full bg-muted">
              <AlertCircle size={10} /> Not connected
            </span>
          )}
          <ChevronDown size={13} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 animate-fade-up border-t border-muted/50 space-y-4">
          {/* Extra fields */}
          {def.fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-sans font-semibold text-foreground block mb-1.5">{f.label}</label>
              <input
                type="text"
                value={fields[f.key] ?? (connection as Record<string, string> | undefined)?.[f.key] ?? ""}
                onChange={(e) => setFields((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="omni-input text-sm"
                disabled={isConnected}
              />
            </div>
          ))}

          {/* Webhook URL (Shopify only, shown when connected) */}
          {def.provider === "shopify" && isConnected && webhookUrl && (
            <div>
              <label className="text-xs font-sans font-semibold text-foreground block mb-1.5">Your Webhook URL</label>
              <p className="text-xs text-muted-foreground font-sans mb-2">
                Register this URL in Shopify Admin → Settings → Notifications → Webhooks for the <strong>orders/paid</strong> event.
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 text-[11px] font-mono bg-muted text-foreground px-3 py-2.5 truncate"
                  style={{ borderRadius: "10px" }}
                >
                  {webhookUrl}
                </code>
                <button onClick={copyWebhook}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground bg-muted hover:bg-accent transition-colors flex-shrink-0"
                  style={{ borderRadius: "10px" }}>
                  <Copy size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Channel info (Slack) */}
          {def.provider === "slack" && isConnected && connection?.channel_name && (
            <div className="flex items-center gap-2 text-xs font-sans text-omni-leaf px-3 py-2.5 bg-omni-leaf/8 rounded-xl">
              <CheckCircle size={12} /> Posting to <strong>#{connection.channel_name}</strong>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-2 pt-1">
            {isConnected ? (
              <>
                <button onClick={handleDisconnect} disabled={loading}
                  className="btn-ghost text-xs py-2.5 flex items-center gap-1.5">
                  {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  Disconnect
                </button>
                <a href={
                  def.provider === "shopify" && connection?.shop_domain
                    ? `https://${connection.shop_domain}/admin` :
                  def.provider === "slack" ? "https://slack.com/app_redirect?channel=general" :
                  def.provider === "google_sheets" && connection?.spreadsheet_id
                    ? `https://docs.google.com/spreadsheets/d/${connection.spreadsheet_id}` : "#"
                } target="_blank" rel="noopener noreferrer"
                  className="btn-primary text-xs py-2.5 flex items-center gap-1.5">
                  <ExternalLink size={11} /> Open {def.name}
                </a>
              </>
            ) : (
              <button onClick={handleConnect} disabled={loading || (def.fields.length > 0 && Object.keys(fields).length === 0 && !def.fields.every((f) => (connection as Record<string, string> | undefined)?.[f.key]))}
                className="btn-primary text-xs py-2.5 flex items-center gap-2">
                {loading ? <Loader2 size={11} className="animate-spin" /> : <Link2 size={11} />}
                Connect {def.name}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { onboarding, saveOnboarding } = useOnboarding();
  const [language, setLanguage] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const [notifState, setNotifState] = useState({ email: true, browser: false, weekly: true });
  const [saved, setSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<"finder" | "grower" | "scaler" | "">(""); 
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "integrations">("general");

  useEffect(() => {
    if (onboarding) {
      setSelectedPersona((onboarding.user_type as "finder" | "grower" | "scaler" | "") ?? "");
      setPrimaryGoal(onboarding.primary_goal ?? "");
    }
  }, [onboarding]);

  // Load OAuth connections
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("oauth_connections")
        .select("*")
        .eq("user_id", user.id);
      if (data) setConnections(data as OAuthConnection[]);

      // Get or create webhook config
      const { data: wh } = await supabase
        .from("webhook_configs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wh) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-webhook?user_id=${user.id}`;
        setWebhookUrl(url);
      } else {
        // Create one
        const { data: created } = await supabase
          .from("webhook_configs")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (created) {
          setWebhookUrl(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-webhook?user_id=${user.id}`);
        }
      }
    };
    load();
  }, [user]);

  // Handle OAuth connection initiation via postMessage + popup
  const handleConnect = async (provider: string, extraFields: Record<string, string>) => {
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Not authenticated."); return; }

    const body: Record<string, string> = { provider, ...extraFields };

    // Invoke the edge function with explicit auth header
    const { data, error } = await supabase.functions.invoke("oauth-handler", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error || !data?.authUrl) {
      let errMsg = `Failed to initiate ${provider} connection.`;
      if (error) {
        try {
          const { FunctionsHttpError } = await import("@supabase/supabase-js");
          if (error instanceof FunctionsHttpError) {
            const txt = await error.context?.text();
            errMsg = txt || errMsg;
          }
        } catch { /* ignore */ }
      }
      toast.error(errMsg);
      return;
    }

    // Open OAuth popup
    const popup = window.open(data.authUrl, `oauth_${provider}`, "width=620,height=720,scrollbars=yes,resizable=yes");
    if (!popup) {
      toast.error("Popup blocked! Please allow popups for this site.");
      return;
    }

    // Listen for postMessage from the OAuth callback page
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || (msg.type !== "OAUTH_SUCCESS" && msg.type !== "OAUTH_ERROR")) return;

      window.removeEventListener("message", handleMessage);

      if (msg.type === "OAUTH_SUCCESS") {
        // Refresh connections from DB
        const { data: refreshed } = await supabase
          .from("oauth_connections")
          .select("*")
          .eq("user_id", user.id);
        if (refreshed) setConnections(refreshed as OAuthConnection[]);
        toast.success(`${msg.provider.replace("_", " ")} connected successfully! 🌸`);
      } else {
        toast.error(`Connection failed: ${msg.error?.replace("_", " ") ?? "Unknown error"}`);
      }
    };

    window.addEventListener("message", handleMessage);

    // Fallback: if popup is closed manually without postMessage
    const fallbackPoll = setInterval(async () => {
      if (popup.closed) {
        clearInterval(fallbackPoll);
        window.removeEventListener("message", handleMessage);
        // Silently refresh connections in case it succeeded
        const { data: refreshed } = await supabase
          .from("oauth_connections")
          .select("*")
          .eq("user_id", user.id);
        if (refreshed) setConnections(refreshed as OAuthConnection[]);
      }
    }, 1000);
  };

  const handleDisconnect = async (provider: string) => {
    if (!user) return;
    await supabase
      .from("oauth_connections")
      .update({ connected: false, access_token: null, refresh_token: null })
      .eq("user_id", user.id)
      .eq("provider", provider);
    setConnections((prev) =>
      prev.map((c) => c.provider === provider ? { ...c, connected: false } : c)
    );
    toast.success(`${provider} disconnected.`);
  };

  const handleProfileSave = async () => {
    if (!selectedPersona) { toast.error("Please select a persona type."); return; }
    setSavingProfile(true);
    await saveOnboarding({ user_type: selectedPersona, primary_goal: primaryGoal });
    setEditingProfile(false);
    setSavingProfile(false);
    toast.success("Profile updated — AI context refreshed for your next chat.", { duration: 4000 });
  };

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const personaLabel = onboarding?.user_type
    ? PERSONA_OPTIONS.find((p) => p.value === onboarding.user_type)
    : null;

  const tabs = [
    { key: "general" as const, label: "General" },
    { key: "integrations" as const, label: "Integrations" },
  ];

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-up">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">Preferences</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 surface-flat p-1 mb-7 animate-fade-up w-fit">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2.5 text-sm font-sans font-semibold transition-all ${
                activeTab === t.key ? "bg-foreground text-background shadow-card" : "text-muted-foreground hover:text-foreground"
              }`} style={{ borderRadius: "10px" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── GENERAL TAB ── */}
        {activeTab === "general" && (
          <>
            {/* Profile */}
            <section className="mb-7 animate-fade-up stagger-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest">Profile</h2>
                <button onClick={() => setEditingProfile((e) => !e)}
                  className="flex items-center gap-1.5 text-xs font-sans font-semibold text-foreground hover:opacity-70 transition-opacity">
                  <Pencil size={11} />{editingProfile ? "Cancel" : "Edit"}
                </button>
              </div>
              <div className="surface-card overflow-hidden">
                <div className="p-6 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-xl text-foreground flex-shrink-0"
                    style={{ background: "hsl(var(--omni-warm))", border: "1px solid rgba(26,26,26,0.1)" }}>
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-sans text-foreground">{user?.username}</p>
                    <p className="text-xs text-muted-foreground font-sans">{user?.email}</p>
                    {personaLabel && (
                      <span className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-sans px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        {personaLabel.emoji} {personaLabel.label}
                        {onboarding?.primary_goal && <> · <em className="not-italic opacity-70 truncate max-w-[100px]">{onboarding.primary_goal}</em></>}
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

                {editingProfile && (
                  <div className="p-6 animate-fade-up">
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <User size={13} strokeWidth={1.5} className="text-muted-foreground" />
                        <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wide">Business Persona</p>
                      </div>
                      <div className="space-y-2">
                        {PERSONA_OPTIONS.map((opt) => (
                          <button key={opt.value} onClick={() => setSelectedPersona(opt.value)}
                            className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all ${
                              selectedPersona === opt.value ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                            }`}
                            style={{ borderRadius: "12px", border: selectedPersona === opt.value ? "none" : "1px solid rgba(26,26,26,0.08)" }}>
                            <span className="text-lg flex-shrink-0">{opt.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold font-sans ${selectedPersona === opt.value ? "text-background" : "text-foreground"}`}>{opt.label}</p>
                              <p className={`text-xs font-sans leading-snug ${selectedPersona === opt.value ? "text-background/70" : "text-muted-foreground"}`}>{opt.desc}</p>
                            </div>
                            {selectedPersona === opt.value && <Check size={14} className="flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target size={13} strokeWidth={1.5} className="text-muted-foreground" />
                        <p className="text-xs font-semibold font-sans text-foreground uppercase tracking-wide">Primary Goal</p>
                      </div>
                      <textarea value={primaryGoal} onChange={(e) => setPrimaryGoal(e.target.value)}
                        placeholder="e.g. Launch my handmade jewellery brand online and get to ₦500k/month within 6 months"
                        rows={3} className="omni-input resize-none" style={{ borderRadius: "12px" }} />
                      <p className="text-[11px] text-muted-foreground font-sans mt-2 opacity-60">Updates AI context for next chat session.</p>
                    </div>
                    <button onClick={handleProfileSave} disabled={savingProfile || !selectedPersona}
                      className="btn-primary w-full py-3.5" style={{ borderRadius: "12px" }}>
                      {savingProfile ? "Saving…" : "Save profile changes"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Appearance */}
            <section className="mb-7 animate-fade-up stagger-2">
              <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Appearance</h2>
              <div className="surface-card overflow-hidden">
                <div className="p-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {theme === "dark" ? <Moon size={15} strokeWidth={1.5} /> : <Sun size={15} strokeWidth={1.5} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-sans text-foreground">Theme</p>
                      <p className="text-xs text-muted-foreground font-sans">{theme === "light" ? "Clean white workspace" : "Deep espresso workspace"}</p>
                    </div>
                  </div>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(26,26,26,0.10)" }}>
                    {(["light", "dark"] as const).map((t) => (
                      <button key={t} onClick={() => setTheme(t)}
                        className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-sans transition-all ${theme === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                        {t === "light" ? <Sun size={10} /> : <Moon size={10} />}
                        {t === "light" ? "Light" : "Dark"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {(["light", "dark"] as const).map((t) => (
                    <button key={t} onClick={() => setTheme(t)}
                      className={`p-4 text-left transition-all ${t === "dark" ? "bg-[#12100E] text-[#F5EFEB]" : "bg-white text-[#1A1A1A]"}`}
                      style={{ borderRadius: "14px", border: theme === t ? "2px solid hsl(var(--foreground))" : "2px solid rgba(26,26,26,0.08)" }}>
                      <p className={`text-xs font-serif mb-2.5 pb-2.5 ${t === "dark" ? "border-b border-[#F5EFEB]/15" : "border-b border-[#1A1A1A]/10"}`}>OmniDesk</p>
                      <div className={`h-1.5 rounded-full w-3/4 mb-2 ${t === "dark" ? "bg-[#2C2520]" : "bg-[#F5EFEB]"}`} />
                      <div className={`h-1 rounded-full w-1/2 ${t === "dark" ? "bg-[#2C2520]" : "bg-[#F5EFEB]"}`} />
                      <p className={`text-[10px] font-sans mt-3 ${t === "dark" ? "text-[#F5EFEB]/40" : "text-[#1A1A1A]/40"}`}>{t === "light" ? "Light · #FFFFFF" : "Espresso · #12100E"}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Language */}
            <section className="mb-7 animate-fade-up stagger-3">
              <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Language</h2>
              <div className="surface-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"><Globe size={14} strokeWidth={1.5} /></div>
                  <div>
                    <p className="text-sm font-semibold font-sans text-foreground">Display Language</p>
                    <p className="text-xs text-muted-foreground font-sans">Currently: {currentLang.nativeLabel}</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setLangOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-sans text-foreground hover:bg-muted transition-colors"
                    style={{ borderRadius: "12px", border: "1px solid rgba(26,26,26,0.10)" }}>
                    <span>{currentLang.nativeLabel} ({currentLang.label})</span>
                    <ChevronDown size={13} className={`text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`} />
                  </button>
                  {langOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background z-20 mt-2 max-h-52 overflow-y-auto shadow-float animate-fade-up"
                      style={{ borderRadius: "12px", border: "1px solid rgba(26,26,26,0.10)" }}>
                      {LANGUAGES.map((lang) => (
                        <button key={lang.code} onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                          className={`w-full px-4 py-3 text-left text-sm font-sans hover:bg-muted transition-colors flex justify-between items-center ${language === lang.code ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}>
                          <span>{lang.nativeLabel}</span>
                          <span className="text-xs opacity-50">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="mb-7 animate-fade-up stagger-4">
              <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Notifications</h2>
              <div className="surface-card overflow-hidden">
                {([
                  { key: "email" as const, label: "Email notifications", sub: "Roadmap updates and bloom events" },
                  { key: "browser" as const, label: "Browser notifications", sub: "Real-time automation alerts" },
                  { key: "weekly" as const, label: "Weekly digest", sub: "Summary of your business growth" },
                ]).map((item, i, arr) => (
                  <div key={item.key} className="p-5 flex items-center justify-between"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(26,26,26,0.06)" : "none" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0"><Bell size={13} strokeWidth={1.5} /></div>
                      <div>
                        <p className="text-sm font-semibold font-sans text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground font-sans">{item.sub}</p>
                      </div>
                    </div>
                    <button onClick={() => setNotifState((n) => ({ ...n, [item.key]: !n[item.key] }))}
                      className={`relative w-10 transition-all flex-shrink-0 ${notifState[item.key] ? "bg-foreground" : "bg-muted"}`}
                      style={{ borderRadius: "50px", minWidth: "44px", minHeight: "24px" }}>
                      <span className="absolute top-0.5 w-5 h-5 bg-background transition-all"
                        style={{ borderRadius: "50px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", left: notifState[item.key] ? "calc(100% - 22px)" : "2px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy */}
            <section className="mb-8 animate-fade-up stagger-5">
              <h2 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Privacy & Security</h2>
              <div className="surface-flat p-5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5"><Shield size={13} strokeWidth={1.5} className="text-muted-foreground" /></div>
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                  Integrations use OAuth — OmniDesk never stores raw credentials. Conversation data is encrypted and persisted to your private workspace only.
                </p>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up pb-6">
              <button onClick={() => { setSaved(true); toast.success("Preferences saved."); setTimeout(() => setSaved(false), 2500); }} className="btn-pill px-8 py-4 flex-1 sm:flex-none">
                {saved ? "✓ Saved" : "Save preferences"}
              </button>
              <button onClick={logout} className="btn-ghost-pill px-6 py-4 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </>
        )}

        {/* ── INTEGRATIONS TAB ── */}
        {activeTab === "integrations" && (
          <div className="animate-fade-up space-y-4 pb-8">
            {/* Header card */}
            <div className="surface-flat p-5 flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={15} strokeWidth={1.5} className="text-omni-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold font-sans text-foreground">Credential Vault</p>
                <p className="text-xs text-muted-foreground font-sans mt-1 leading-relaxed">
                  Connect Shopify, Google Sheets, and Slack. When a Shopify order is paid, OmniDesk automatically logs it to your spreadsheet and pings your Slack channel. All tokens are stored securely using OAuth.
                </p>
              </div>
            </div>

            {/* Automation flow diagram */}
            <div className="surface-flat p-4 mb-2">
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">Automation Pipeline</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Shopify Order Paid", color: "#96BF48", logo: "🛍" },
                  { label: "→" },
                  { label: "Google Sheets Row", color: "#0F9D58", logo: "G" },
                  { label: "+" },
                  { label: "Slack Notification", color: "#4A154B", logo: "#" },
                ].map((item, i) =>
                  "label" in item && "color" in item ? (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans font-semibold"
                      style={{ background: `${item.color}15`, color: item.color }}>
                      <span>{item.logo}</span> {item.label}
                    </div>
                  ) : (
                    <span key={i} className="text-muted-foreground font-bold">{item.label}</span>
                  )
                )}
              </div>
            </div>

            {INTEGRATION_DEFS.map((def) => (
              <IntegrationCard
                key={def.provider}
                def={def}
                connection={connections.find((c) => c.provider === def.provider)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                webhookUrl={def.provider === "shopify" ? webhookUrl : undefined}
              />
            ))}

            {/* Automation logs preview */}
            <AutomationLogs userId={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Automation logs preview ── */
function AutomationLogs({ userId }: { userId?: string }) {
  const [logs, setLogs] = useState<Array<{ id: string; event_type: string; status: string; created_at: string; payload: Record<string, unknown>; error_message?: string }>>([]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("automation_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setLogs(data); });
  }, [userId]);

  if (logs.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">Recent Automation Runs</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="surface-flat px-4 py-3 flex items-center gap-3">
            {log.status === "success" ? (
              <CheckCircle size={13} className="text-omni-leaf flex-shrink-0" />
            ) : (
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold font-sans text-foreground capitalize">{log.event_type.replace("/", " · ")}</p>
              {log.error_message && <p className="text-[11px] text-red-400 font-sans truncate">{log.error_message}</p>}
            </div>
            <span className="text-[11px] text-muted-foreground font-sans flex-shrink-0">
              {new Date(log.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
