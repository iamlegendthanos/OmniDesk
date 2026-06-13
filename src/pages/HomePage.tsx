import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  MessageCircle, Map, Flower2, ArrowRight, TrendingUp,
  Lightbulb, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ─────────────────────────────────────────────────────────────
   ANIMATED CIRCULAR PROGRESS RING
───────────────────────────────────────────────────────────── */
function ProgressRing({
  roadmapPct,
  bloomedNodes,
  chatExchanges,
}: {
  roadmapPct: number;
  bloomedNodes: number;
  chatExchanges: number;
}) {
  // Composite score: roadmap 50% weight, bloom nodes 30%, chat 20%
  const bloomScore = Math.min(bloomedNodes / 4, 1) * 100;
  const chatScore = Math.min(chatExchanges / 8, 1) * 100;
  const composite = Math.round(roadmapPct * 0.5 + bloomScore * 0.3 + chatScore * 0.2);

  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.7
  const dashOffset = circumference - (composite / 100) * circumference;

  return (
    <div className="surface-card p-7 flex flex-col items-center justify-center animate-fade-up stagger-1">
      <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-6 text-center">
        OmniDesk score
      </p>

      {/* Ring SVG */}
      <div className="relative mb-5">
        <svg width="128" height="128" viewBox="0 0 128 128" className="ring-glow">
          {/* Track */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="7"
          />
          {/* Progress arc */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          {/* Glow dot at tip */}
          {composite > 3 && (() => {
            const angle = ((composite / 100) * 360 - 90) * (Math.PI / 180);
            const dotX = 64 + radius * Math.cos(angle);
            const dotY = 64 + radius * Math.sin(angle);
            return (
              <circle
                cx={dotX} cy={dotY} r="5"
                fill="hsl(var(--foreground))"
                opacity="0.9"
              />
            );
          })()}
          {/* Score text */}
          <text
            x="64" y="60"
            textAnchor="middle"
            fontSize="28"
            fontWeight="700"
            fontFamily="Playfair Display, Georgia, serif"
            fill="hsl(var(--foreground))"
            className="animate-score"
          >
            {composite}
          </text>
          <text
            x="64" y="77"
            textAnchor="middle"
            fontSize="10"
            fontFamily="Inter, sans-serif"
            fill="hsl(var(--muted-foreground))"
          >
            / 100
          </text>
        </svg>
      </div>

      {/* Breakdown rows */}
      <div className="w-full space-y-3">
        {[
          { label: "Roadmap", value: Math.round(roadmapPct), max: 100, color: "bg-foreground", weight: "50%" },
          { label: "Integrations", value: Math.min(bloomedNodes, 4), max: 4, color: "bg-omni-leaf", weight: "30%" },
          { label: "Strategy chat", value: Math.min(chatExchanges, 8), max: 8, color: "bg-omni-gold", weight: "20%" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-sans text-muted-foreground">{row.label}</span>
              <span className="text-xs font-sans font-semibold text-foreground">
                {row.value}/{row.max}
                <span className="text-muted-foreground font-normal ml-1">· {row.weight}</span>
              </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${row.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${(row.value / row.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI "NEXT ACTION" CARD
───────────────────────────────────────────────────────────── */
function NextActionCard({ user, items, nodes, onboarding }: {
  user: { username?: string } | null;
  items: { status: string; title: string; category: string }[];
  nodes: { state: string; tool: string }[];
  onboarding: { user_type?: string; primary_goal?: string } | null;
}) {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const cached = sessionStorage.getItem("omni-next-action");
    if (cached) { setSuggestion(cached); return; }

    const runFetch = async () => {
      setLoading(true);
      const pending = items.filter((i) => i.status === "pending").slice(0, 3).map((i) => i.title);
      const seeds = nodes.filter((n) => n.state === "seed").map((n) => n.tool);
      const personaContext = onboarding?.user_type
        ? `User profile: ${onboarding.user_type}. Goal: "${onboarding.primary_goal || "not specified"}".`
        : "";

      const { data, error } = await supabase.functions.invoke("omni-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `${personaContext}
Based on this user's business status, give ONE concise next action (max 2 sentences, direct advice, no preamble):
Pending roadmap tasks: ${pending.join(", ") || "none"}
Unconnected tools: ${seeds.join(", ") || "none"}
Completed tasks: ${items.filter((i) => i.status === "done").length} of ${items.length}
Reply with just the action recommendation.`,
            },
          ],
          userName: user.username,
        },
      });

      if (cancelled) return;
      let msg = "Start a chat session to get your personalised next action from OmniDesk.";
      if (!error && data?.content) {
        msg = data.content;
      } else if (error instanceof FunctionsHttpError) {
        try { const t = await error.context?.text(); console.error("AI error:", t); } catch {}
      }
      setSuggestion(msg);
      sessionStorage.setItem("omni-next-action", msg);
      setLoading(false);
    };
    runFetch();
    return () => { cancelled = true; };
  }, [user?.username]);

  return (
    <div className="surface-card p-6 animate-fade-up stagger-3">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-omni-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb size={16} strokeWidth={1.5} className="text-omni-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold font-sans text-foreground">OmniDesk recommends</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full text-omni-gold bg-omni-gold/10 font-sans font-semibold uppercase tracking-wide">AI</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
              <Loader2 size={13} className="animate-spin" /> Analysing your workspace…
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">{suggestion}</p>
          )}
        </div>
        <Link to="/chat" className="flex-shrink-0 text-xs font-sans font-semibold text-foreground flex items-center gap-1.5 hover:gap-3 transition-all duration-200 whitespace-nowrap">
          Open chat <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RECHARTS BAR CHART
───────────────────────────────────────────────────────────── */
function RoadmapChart({ items }: { items: { week: number; status: string }[] }) {
  const weeks = [1, 2, 3, 4];
  const data = weeks.map((w) => {
    const weekItems = items.filter((i) => i.week === w);
    return {
      week: `Wk ${w}`,
      done: weekItems.filter((i) => i.status === "done").length,
      inProgress: weekItems.filter((i) => i.status === "in_progress").length,
      pending: weekItems.filter((i) => i.status === "pending").length,
    };
  });

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card px-4 py-3 text-xs font-sans" style={{ minWidth: 120 }}>
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
            <span style={{ color: p.color }} className="capitalize">{p.name}</span>
            <span className="font-semibold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barGap={2} barCategoryGap="30%">
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fontFamily: "Inter", fill: "hsl(var(--muted-foreground))" }}
          axisLine={false} tickLine={false}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", borderRadius: 6 }} />
        <Bar dataKey="done" name="done" radius={[4, 4, 0, 0]} maxBarSize={20}>
          {data.map((_, i) => <Cell key={i} fill="hsl(var(--foreground))" opacity={0.85} />)}
        </Bar>
        <Bar dataKey="inProgress" name="in progress" radius={[4, 4, 0, 0]} maxBarSize={20}>
          {data.map((_, i) => <Cell key={i} fill="hsl(38 85% 55%)" opacity={0.7} />)}
        </Bar>
        <Bar dataKey="pending" name="pending" radius={[4, 4, 0, 0]} maxBarSize={20}>
          {data.map((_, i) => <Cell key={i} fill="hsl(var(--muted-foreground))" opacity={0.25} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────────────────────────────────────────────────
   NODE HEALTH GRID
───────────────────────────────────────────────────────────── */
function NodeHealthGrid({ nodes }: { nodes: { tool: string; state: string; uptime: number; label: string }[] }) {
  const toolColors: Record<string, { color: string; logo: string }> = {
    paystack: { color: "#00C3F7", logo: "P" },
    flutterwave: { color: "#F5A623", logo: "F" },
    whatsapp: { color: "#25D366", logo: "W" },
    google_workspace: { color: "#4285F4", logo: "G" },
    make: { color: "#6D00CC", logo: "M" },
    mailchimp: { color: "#FFE01B", logo: "✉" },
    notion: { color: "#888", logo: "N" },
    instagram: { color: "#E1306C", logo: "IG" },
    slack: { color: "#4A154B", logo: "#" },
    stripe: { color: "#635BFF", logo: "S" },
    shopify: { color: "#96BF48", logo: "🛍" },
    quickbooks: { color: "#2CA01C", logo: "QB" },
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {nodes.slice(0, 4).map((node) => {
        const t = toolColors[node.tool] ?? { color: "#888", logo: "?" };
        const isBloom = node.state === "bloom";
        const isSprout = node.state === "sprout";
        return (
          <div key={node.tool} className="surface-flat p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: `${t.color}15`, color: t.color }}
            >
              {t.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold font-sans text-foreground truncate">{node.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isBloom ? "bg-omni-leaf animate-pulse" : isSprout ? "bg-omni-gold" : "bg-muted-foreground opacity-30"
                }`} />
                <span className="text-[11px] text-muted-foreground font-sans">
                  {isBloom ? `${node.uptime}% uptime` : isSprout ? "Configuring" : "Not planted"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const { items } = useRoadmap();
  const { nodes } = useWorkflowNodes();
  const { onboarding } = useOnboarding();
  const [chatExchanges, setChatExchanges] = useState(0);

  // Load chat exchange count for progress ring
  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_messages")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("role", "user")
      .then(({ count }) => { if (count) setChatExchanges(count); });
  }, [user]);

  const done = items.filter((i) => i.status === "done").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const blooming = nodes.filter((n) => n.state === "bloom").length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const firstName = user?.username?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const personaLabel = onboarding?.user_type
    ? { finder: "Finder", grower: "Grower", scaler: "Scaler" }[onboarding.user_type] ?? onboarding.user_type
    : null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground leading-tight">
          {greeting}, {firstName}.
        </h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <p className="text-muted-foreground font-sans text-lg">
            Your business is{" "}
            <span className="text-omni-leaf font-semibold">
              {blooming > 0 ? `${blooming} integration${blooming > 1 ? "s" : ""} live` : "ready to grow"}
            </span>.
          </p>
          {personaLabel && (
            <span className="text-xs font-sans px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
              {personaLabel}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards + progress ring row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {/* Stat cards (4 cols on md) */}
        {[
          { label: "Roadmap progress", value: `${progress}%`, sub: `${done} of ${items.length} complete`, color: "text-omni-leaf", bg: "bg-omni-leaf/8" },
          { label: "Live integrations", value: String(blooming), sub: "Blooming in flowerbed", color: "text-omni-bloom", bg: "bg-omni-bloom/8" },
          { label: "In progress", value: String(inProgress), sub: "Tasks active now", color: "text-omni-gold", bg: "bg-omni-gold/8" },
          { label: "Seeds ready", value: String(nodes.filter((n) => n.state === "seed").length), sub: "Waiting to plant", color: "text-muted-foreground", bg: "bg-muted/40" },
        ].map((stat, i) => (
          <div key={stat.label} className="surface-card p-5 animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} mb-4`}>
              <TrendingUp size={16} strokeWidth={1.5} className={stat.color} />
            </div>
            <p className={`font-serif text-3xl ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-xs font-semibold font-sans text-foreground mb-0.5">{stat.label}</p>
            <p className="text-xs text-muted-foreground font-sans">{stat.sub}</p>
          </div>
        ))}

        {/* Progress ring — 5th cell, spans full row on mobile */}
        <div className="col-span-2 md:col-span-1">
          <ProgressRing
            roadmapPct={progress}
            bloomedNodes={blooming}
            chatExchanges={chatExchanges}
          />
        </div>
      </div>

      {/* AI Next Action */}
      <div className="mb-8">
        <NextActionCard user={user} items={items} nodes={nodes} onboarding={onboarding} />
      </div>

      {/* Analytics section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Roadmap chart */}
        <div className="surface-card p-6 animate-fade-up stagger-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold font-sans text-foreground">Roadmap completions</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">Tasks per week by status</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-sans text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-foreground opacity-85" />Done</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-omni-gold opacity-70" />Active</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-muted-foreground opacity-30" />Pending</span>
            </div>
          </div>
          <RoadmapChart items={items} />
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-sans">Overall completion rate</p>
              <p className="font-serif text-xl text-foreground">{progress}%</p>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Node health grid */}
        <div className="surface-card p-6 animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold font-sans text-foreground">Integration health</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">Node uptime & status</p>
            </div>
            <Link to="/flowerbed" className="text-xs font-sans text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <NodeHealthGrid nodes={nodes} />
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
            <div className="flex items-center gap-4 text-xs font-sans text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-omni-leaf" />{blooming} live</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-omni-gold" />{nodes.filter((n) => n.state === "sprout").length} configuring</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground opacity-30" />{nodes.filter((n) => n.state === "seed").length} seeds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {[
          {
            to: "/chat",
            icon: <MessageCircle size={20} strokeWidth={1.5} />,
            title: "Strategy Chat",
            desc: "Continue your conversation with your AI business partner.",
            cta: "Open chat",
            accentBg: "bg-omni-bloom/10",
            accent: "text-omni-bloom",
          },
          {
            to: "/roadmaps",
            icon: <Map size={20} strokeWidth={1.5} />,
            title: "Roadmap",
            desc: `${inProgress} tasks in progress across your 30-day plan.`,
            cta: "View roadmap",
            accentBg: "bg-omni-gold/10",
            accent: "text-omni-gold",
          },
          {
            to: "/flowerbed",
            icon: <Flower2 size={20} strokeWidth={1.5} />,
            title: "Workflow Flowerbed",
            desc: `${blooming} blooming · ${nodes.filter((n) => n.state === "seed").length} seeds ready to plant.`,
            cta: "Open flowerbed",
            accentBg: "bg-omni-leaf/10",
            accent: "text-omni-leaf",
          },
        ].map((item, i) => (
          <Link
            key={item.to} to={item.to}
            className="surface-card p-7 hover:shadow-float transition-all duration-300 group block animate-fade-up"
            style={{ animationDelay: `${0.3 + i * 0.1}s`, textDecoration: "none" }}
          >
            <div className={`w-11 h-11 rounded-xl ${item.accentBg} flex items-center justify-center mb-5`}>
              <span className={item.accent}>{item.icon}</span>
            </div>
            <h3 className="font-serif text-xl text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground font-sans mb-5 leading-relaxed">{item.desc}</p>
            <div className="flex items-center gap-1.5 text-xs font-sans text-foreground font-semibold group-hover:gap-3 transition-all duration-200">
              {item.cta} <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      {/* Current priorities */}
      <div className="animate-fade-up stagger-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-2xl text-foreground">Current priorities</h2>
          <Link to="/roadmaps" className="text-xs text-muted-foreground font-sans hover:text-foreground flex items-center gap-1.5 transition-colors">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="space-y-3">
          {items.filter((i) => i.status !== "done").slice(0, 4).map((item) => (
            <div key={item.id} className="surface-flat px-6 py-4 flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                item.status === "in_progress" ? "bg-omni-gold animate-pulse" : "border border-muted-foreground opacity-30"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-sans text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground font-sans">Week {item.week} · {item.category}</p>
              </div>
              <span className={`text-xs font-sans px-3 py-1 rounded-full ${
                item.status === "in_progress" ? "bg-omni-gold/10 text-omni-gold" : "text-muted-foreground bg-muted"
              }`}>
                {item.status === "in_progress" ? "In progress" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
