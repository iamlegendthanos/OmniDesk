import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { MessageCircle, Map, Flower2, ArrowRight, TrendingUp, Zap } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { items } = useRoadmap();
  const { nodes } = useWorkflowNodes();

  const done = items.filter((i) => i.status === "done").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const blooming = nodes.filter((n) => n.state === "bloom").length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const firstName = user?.username?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground leading-tight">
          Good morning, {firstName}.
        </h1>
        <p className="text-muted-foreground font-sans mt-3 text-lg">
          Your business is{" "}
          <span className="text-omni-leaf font-semibold">
            {blooming > 0 ? `${blooming} integration${blooming > 1 ? "s" : ""} live` : "ready to grow"}
          </span>
          .
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Roadmap progress", value: `${progress}%`, sub: `${done} of ${items.length} complete`, color: "text-omni-leaf", bg: "bg-omni-leaf/8" },
          { label: "Active integrations", value: String(blooming), sub: "Blooming in flowerbed", color: "text-omni-bloom", bg: "bg-omni-bloom/8" },
          { label: "In progress", value: String(inProgress), sub: "Tasks this week", color: "text-omni-gold", bg: "bg-omni-gold/8" },
          { label: "Seeds ready", value: String(nodes.filter(n => n.state === "seed").length), sub: "Waiting to be planted", color: "text-muted-foreground", bg: "bg-muted/40" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="surface-card p-5 animate-fade-up"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} mb-4`}>
              <TrendingUp size={16} strokeWidth={1.5} className={stat.color} />
            </div>
            <p className={`font-serif text-3xl ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-xs font-semibold font-sans text-foreground mb-0.5">{stat.label}</p>
            <p className="text-xs text-muted-foreground font-sans">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="surface-card p-6 mb-10 animate-fade-up stagger-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold font-sans text-foreground">30-Day Roadmap Progress</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{done} milestones complete</p>
          </div>
          <span className="font-serif text-3xl text-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-5 mb-10">
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
            desc: `${blooming} blooming · ${nodes.filter(n => n.state === "seed").length} seeds ready to plant.`,
            cta: "Open flowerbed",
            accentBg: "bg-omni-leaf/10",
            accent: "text-omni-leaf",
          },
        ].map((item, i) => (
          <Link
            key={item.to}
            to={item.to}
            className="surface-card p-7 hover:shadow-float transition-all duration-300 group block animate-fade-up"
            style={{ animationDelay: `${0.2 + i * 0.1}s`, textDecoration: "none" }}
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

      {/* Recent roadmap items */}
      <div className="animate-fade-up stagger-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-2xl text-foreground">Current priorities</h2>
          <Link to="/roadmaps" className="text-xs text-muted-foreground font-sans hover:text-foreground flex items-center gap-1.5 transition-colors">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="space-y-3">
          {items
            .filter((i) => i.status !== "done")
            .slice(0, 4)
            .map((item) => (
              <div
                key={item.id}
                className="surface-flat px-6 py-4 flex items-center gap-4"
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  item.status === "in_progress" ? "bg-omni-gold animate-pulse" : "border border-muted-foreground opacity-30"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-sans text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground font-sans">Week {item.week} · {item.category}</p>
                </div>
                <span className={`text-xs font-sans px-3 py-1 rounded-full ${
                  item.status === "in_progress"
                    ? "bg-omni-gold/10 text-omni-gold"
                    : "text-muted-foreground bg-muted"
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
