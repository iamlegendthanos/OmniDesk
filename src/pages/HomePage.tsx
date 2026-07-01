import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { TOOL_CONFIGS } from "@/constants";
import {
  MessageCircle, Map, Flower2, ArrowRight, TrendingUp,
  Lightbulb, Loader2, CheckCircle, ChevronRight, Zap,
  Target, BarChart2, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ── Greeting helper ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Persona pill ── */
const PERSONA_META: Record<string, { emoji: string; label: string; color: string }> = {
  finder: { emoji: "🔍", label: "Finder", color: "bg-omni-gold/10 text-omni-gold" },
  grower: { emoji: "🌱", label: "Grower", color: "bg-omni-leaf/10 text-omni-leaf" },
  scaler: { emoji: "🚀", label: "Scaler", color: "bg-omni-bloom/10 text-omni-bloom" },
};

/* ─────────────────────────────────────────────────────────────
   PROGRESS RING — compact
───────────────────────────────────────────────────────────── */
function ProgressRing({ score }: { score: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
      <circle cx="40" cy="40" r={r} fill="none"
        stroke="hsl(var(--foreground))" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
      />
      <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="700"
        fontFamily="Playfair Display, serif" fill="hsl(var(--foreground))">{score}</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI INSIGHT CARD
───────────────────────────────────────────────────────────── */
function AiInsightCard({ user, items, nodes, onboarding }: {
  user: { username?: string; id: string } | null;
  items: { status: string; title: string; category: string }[];
  nodes: { state: string; tool: string }[];
  onboarding: { user_type?: string; primary_goal?: string } | null;
}) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const cached = sessionStorage.getItem("omni-next-action-v2");
    if (cached) { setSuggestion(cached); return; }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const pending = items.filter((i) => i.status === "pending").slice(0, 3).map((i) => i.title);
      const seeds = nodes.filter((n) => n.state === "seed").map((n) => n.tool);
      const personaCtx = onboarding?.user_type
        ? `User profile: ${onboarding.user_type}. Goal: "${onboarding.primary_goal || "not specified"}".` : "";

      const { data, error } = await supabase.functions.invoke("omni-chat", {
        body: {
          messages: [{
            role: "user",
            content: `${personaCtx} Give ONE concise next action for this user (max 2 sentences, direct, no preamble): Pending tasks: ${pending.join(", ") || "none"}. Unconnected tools: ${seeds.join(", ") || "none"}. Completed: ${items.filter(i=>i.status==="done").length} of ${items.length}.`,
          }],
          userName: user.username,
        },
      });
      if (cancelled) return;
      let msg = "Open the chat to get your personalised next action from OmniDesk.";
      if (!error && data?.content) {
        msg = data.content;
      } else if (error instanceof FunctionsHttpError) {
        try { await error.context?.text(); } catch {}
      }
      setSuggestion(msg);
      sessionStorage.setItem("omni-next-action-v2", msg);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [user?.username]);

  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-xl bg-omni-gold/10 flex items-center justify-center flex-shrink-0">
        <Lightbulb size={15} strokeWidth={1.5} className="text-omni-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wide mb-1.5">
          OmniDesk recommends
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
            <Loader2 size={12} className="animate-spin" /> Analysing your workspace…
          </div>
        ) : (
          <p className="text-sm text-foreground font-sans leading-relaxed">{suggestion}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RECHARTS CHART
───────────────────────────────────────────────────────────── */
function RoadmapChart({ items }: { items: { week: number; status: string }[] }) {
  const data = [1, 2, 3, 4].map((w) => {
    const wk = items.filter((i) => i.week === w);
    return {
      week: `W${w}`,
      done: wk.filter((i) => i.status === "done").length,
      active: wk.filter((i) => i.status === "in_progress").length,
      pending: wk.filter((i) => i.status === "pending").length,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: "Inter", fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", borderRadius: 6 }}
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 11, fontFamily: "Inter" }}
        />
        <Bar dataKey="done" name="Done" radius={[3,3,0,0]} maxBarSize={14}>
          {data.map((_, i) => <Cell key={i} fill="hsl(var(--foreground))" opacity={0.85} />)}
        </Bar>
        <Bar dataKey="active" name="Active" radius={[3,3,0,0]} maxBarSize={14}>
          {data.map((_, i) => <Cell key={i} fill="hsl(38 85% 55%)" opacity={0.7} />)}
        </Bar>
        <Bar dataKey="pending" name="Pending" radius={[3,3,0,0]} maxBarSize={14}>
          {data.map((_, i) => <Cell key={i} fill="hsl(var(--muted-foreground))" opacity={0.25} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────────────────────────────────────────────
   INTEGRATION ROW
───────────────────────────────────────────────────────────── */
function IntegrationRow({ node }: { node: { tool: string; state: string; label: string; uptime?: number } }) {
  const tool = TOOL_CONFIGS[node.tool];
  if (!tool) return null;
  const isBloom = node.state === "bloom";
  const isSprout = node.state === "sprout";
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: `${tool.color}15`, color: tool.color }}>
        {tool.logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold font-sans text-foreground truncate">{node.label}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isBloom ? (
          <span className="flex items-center gap-1 text-[11px] font-sans text-omni-leaf">
            <span className="w-1.5 h-1.5 rounded-full bg-omni-leaf animate-pulse" />
            {node.uptime}%
          </span>
        ) : isSprout ? (
          <span className="text-[11px] font-sans text-omni-gold">Configuring</span>
        ) : (
          <span className="text-[11px] font-sans text-muted-foreground opacity-50">Seed</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items } = useRoadmap();
  const { nodes } = useWorkflowNodes();
  const { onboarding } = useOnboarding();
  const [chatExchanges, setChatExchanges] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("id", { count: "exact" }).eq("user_id", user.id).eq("role", "user")
      .then(({ count }) => { if (count) setChatExchanges(count); });
  }, [user]);

  const done = items.filter((i) => i.status === "done").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const blooming = nodes.filter((n) => n.state === "bloom").length;
  const sprouting = nodes.filter((n) => n.state === "sprout").length;
  const seeds = nodes.filter((n) => n.state === "seed").length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const bloomScore = Math.min(blooming / 4, 1) * 100;
  const chatScore = Math.min(chatExchanges / 8, 1) * 100;
  const composite = Math.round(progress * 0.5 + bloomScore * 0.3 + chatScore * 0.2);

  const firstName = user?.username?.split(" ")[0] || "there";
  const persona = onboarding?.user_type ? PERSONA_META[onboarding.user_type] : null;
  const pendingItems = items.filter((i) => i.status !== "done").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO STRIP ── */}
      <div className="px-5 md:px-10 pt-8 pb-6 animate-fade-up"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div className="max-w-4xl">
          {/* Date */}
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-3">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {/* Greeting row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight">
                {getGreeting()}, {firstName} 👋
              </h1>
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                {persona && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-full ${persona.color}`}>
                    {persona.emoji} {persona.label}
                  </span>
                )}
                {onboarding?.primary_goal && (
                  <span className="text-sm text-muted-foreground font-sans truncate max-w-xs">
                    — {onboarding.primary_goal}
                  </span>
                )}
              </div>
            </div>
            {/* Score ring */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <ProgressRing score={composite} />
              <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wide">Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-10 py-6 space-y-6 max-w-4xl">

        {/* ── AI INSIGHT BANNER ── */}
        <div className="surface-card p-5 animate-fade-up stagger-1">
          <AiInsightCard user={user} items={items} nodes={nodes} onboarding={onboarding} />
          <div className="mt-4 pt-4 flex gap-3" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
            <button onClick={() => navigate("/chat")} className="btn-pill text-xs px-5 py-2.5 flex items-center gap-1.5">
              <MessageCircle size={12} /> Open Chat
            </button>
            <button onClick={() => navigate("/roadmaps")} className="btn-ghost-pill text-xs px-5 py-2.5 flex items-center gap-1.5">
              <Map size={12} /> View Roadmap
            </button>
          </div>
        </div>

        {/* ── STAT ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up stagger-2">
          {[
            { label: "Roadmap", value: `${progress}%`, sub: `${done}/${items.length} done`, icon: Target, color: "text-omni-leaf", bg: "bg-omni-leaf/10", to: "/roadmaps" },
            { label: "Live tools", value: String(blooming), sub: blooming > 0 ? "Blooming" : "None yet", icon: Zap, color: "text-omni-bloom", bg: "bg-omni-bloom/10", to: "/flowerbed" },
            { label: "In progress", value: String(inProgress), sub: "Active tasks", icon: Activity, color: "text-omni-gold", bg: "bg-omni-gold/10", to: "/roadmaps" },
            { label: "Seeds", value: String(seeds), sub: "Ready to plant", icon: Flower2, color: "text-muted-foreground", bg: "bg-muted", to: "/flowerbed" },
          ].map((stat, i) => (
            <Link key={stat.label} to={stat.to}
              className="surface-card p-4 flex flex-col gap-3 hover:shadow-float transition-all duration-300 group"
              style={{ textDecoration: "none", animationDelay: `${i * 0.07}s` }}>
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={15} strokeWidth={1.5} className={stat.color} />
              </div>
              <div>
                <p className={`font-serif text-3xl ${stat.color}`}>{stat.value}</p>
                <p className="text-xs font-semibold font-sans text-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground font-sans">{stat.sub}</p>
              </div>
              <ChevronRight size={12} className="text-muted-foreground group-hover:translate-x-1 transition-transform mt-auto self-end" />
            </Link>
          ))}
        </div>

        {/* ── TWO COL: Roadmap progress + Integrations ── */}
        <div className="grid md:grid-cols-2 gap-5 animate-fade-up stagger-3">

          {/* Roadmap progress card */}
          <div className="surface-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold font-sans text-foreground">30-Day Roadmap</p>
                <p className="text-xs text-muted-foreground font-sans">Weekly completion</p>
              </div>
              <Link to="/roadmaps" className="flex items-center gap-1 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
                Full view <ArrowRight size={10} />
              </Link>
            </div>
            <RoadmapChart items={items} />
            {/* Progress bar */}
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-sans text-muted-foreground">Overall</span>
                <span className="font-serif text-lg text-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex gap-3 mt-3 text-[10px] font-sans text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-foreground opacity-85" />Done</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "hsl(38 85% 55%)" }} />Active</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground opacity-30" />Pending</span>
              </div>
            </div>
          </div>

          {/* Integrations card */}
          <div className="surface-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold font-sans text-foreground">Integrations</p>
                <p className="text-xs text-muted-foreground font-sans">{blooming} live · {sprouting} configuring</p>
              </div>
              <Link to="/flowerbed" className="flex items-center gap-1 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors">
                Flowerbed <ArrowRight size={10} />
              </Link>
            </div>
            <div className="flex-1">
              {nodes.slice(0, 4).map((n) => <IntegrationRow key={n.id} node={n} />)}
              {nodes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Flower2 size={24} strokeWidth={1} className="text-muted-foreground mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground font-sans">No tools planted yet</p>
                </div>
              )}
            </div>
            <Link to="/flowerbed"
              className="mt-4 pt-4 flex items-center justify-between text-xs font-sans font-semibold text-foreground hover:opacity-70 transition-opacity"
              style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
              <span>Open Workflow Flowerbed</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── CURRENT PRIORITIES ── */}
        <div className="animate-fade-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Today's priorities</h2>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">{inProgress} active · {items.filter(i=>i.status==="pending").length} pending</p>
            </div>
            <Link to="/roadmaps" className="text-xs text-muted-foreground font-sans hover:text-foreground flex items-center gap-1 transition-colors">
              All tasks <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {pendingItems.length > 0 ? pendingItems.map((item, i) => (
              <Link key={item.id} to="/roadmaps"
                className="surface-flat px-5 py-4 flex items-center gap-4 hover:shadow-float transition-all duration-200 group block"
                style={{ textDecoration: "none" }}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-125 ${
                  item.status === "in_progress" ? "bg-omni-gold animate-pulse" : "border-2 border-muted-foreground opacity-30"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-sans text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground font-sans">Week {item.week} · {item.category}</p>
                </div>
                <span className={`text-xs font-sans px-2.5 py-1 rounded-full flex-shrink-0 ${
                  item.status === "in_progress" ? "bg-omni-gold/10 text-omni-gold" : "bg-muted text-muted-foreground"
                }`}>
                  {item.status === "in_progress" ? "Active" : "Pending"}
                </span>
                <ChevronRight size={13} className="text-muted-foreground flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            )) : (
              <div className="surface-flat px-6 py-8 text-center">
                <CheckCircle size={22} strokeWidth={1.5} className="text-omni-leaf mx-auto mb-3 opacity-60" />
                <p className="text-sm font-semibold font-sans text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground font-sans mt-1">No pending tasks right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK NAV ROW ── */}
        <div className="grid grid-cols-3 gap-3 pb-6 animate-fade-up stagger-5">
          {[
            { to: "/chat", icon: MessageCircle, label: "Strategy Chat", desc: "Talk to your AI partner" },
            { to: "/roadmaps", icon: Map, label: "Roadmaps", desc: "Your 30-day plan" },
            { to: "/flowerbed", icon: Flower2, label: "Flowerbed", desc: "Connect your tools" },
          ].map((item) => (
            <Link key={item.to} to={item.to}
              className="surface-card p-4 flex flex-col items-center text-center gap-2.5 hover:shadow-float transition-all duration-300 group"
              style={{ textDecoration: "none" }}>
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon size={18} strokeWidth={1.5} className="text-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold font-sans text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5 hidden sm:block">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
