import { useState } from "react";
import { useRoadmap } from "@/hooks/useRoadmap";
import type { RoadmapItem } from "@/types";
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_CONFIG = {
  done: { label: "Done", icon: CheckCircle, color: "text-omni-leaf", bg: "bg-omni-leaf/10" },
  in_progress: { icon: Clock, label: "In progress", color: "text-omni-gold", bg: "bg-omni-gold/10" },
  pending: { icon: Circle, label: "Pending", color: "text-muted-foreground", bg: "bg-muted/50" },
};

function RoadmapCard({ item, onStatusChange }: {
  item: RoadmapItem;
  onStatusChange: (id: string, s: RoadmapItem["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const Icon = cfg.icon;

  const cycleStatus = () => {
    const next: Record<RoadmapItem["status"], RoadmapItem["status"]> = {
      pending: "in_progress",
      in_progress: "done",
      done: "pending",
    };
    onStatusChange(item.id, next[item.status]);
  };

  return (
    <div className={`surface-flat transition-all duration-200 overflow-hidden ${item.status === "done" ? "opacity-55" : ""}`}>
      <div
        className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); cycleStatus(); }}
          className={`flex-shrink-0 transition-colors hover:opacity-70 ${cfg.color}`}
          title="Click to cycle status"
        >
          <Icon size={17} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold font-sans text-foreground ${item.status === "done" ? "line-through" : ""}`}>
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Week {item.week} · {item.category}</p>
        </div>
        <span className={`text-xs font-sans px-3 py-1.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        {open
          ? <ChevronUp size={13} className="text-muted-foreground flex-shrink-0" />
          : <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />
        }
      </div>
      {open && (
        <div className="px-5 pb-5 animate-fade-up" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed pt-4 mb-5 pl-8">{item.description}</p>
          <div className="flex gap-2 pl-8">
            {(["pending", "in_progress", "done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(item.id, s)}
                className={`px-4 py-2 text-xs font-sans transition-all ${
                  item.status === s
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={{ borderRadius: "50px", border: "1px solid rgba(26,26,26,0.10)" }}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapsPage() {
  const { items, loading, updateStatus } = useRoadmap();
  const [filter, setFilter] = useState<"all" | RoadmapItem["status"]>("all");

  const weeks = [1, 2, 3, 4];
  const done = items.filter((i) => i.status === "done").length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const byWeek = (w: number) => filtered.filter((i) => i.week === w);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="omni-spinner mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-sans">Loading roadmap…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">Your plan</p>
        <h1 className="font-serif text-5xl text-foreground">30-Day Roadmap</h1>
        <p className="text-muted-foreground font-sans mt-2 text-lg">
          Personalised milestones from your OmniDesk strategy session.
        </p>
      </div>

      {/* Progress card */}
      <div className="surface-card p-6 mb-8 animate-fade-up stagger-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold font-sans text-foreground">Overall progress</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{done} of {items.length} milestones complete</p>
          </div>
          <p className="font-serif text-4xl text-foreground">{progress}%</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 animate-fade-up stagger-2 flex-wrap">
        {(["all", "pending", "in_progress", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 text-xs font-semibold font-sans transition-all ${
              filter === f ? "bg-foreground text-background shadow-card" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            style={{ borderRadius: "50px", border: filter === f ? "none" : "1px solid rgba(26,26,26,0.10)" }}
          >
            {f === "all" ? "All" : f === "in_progress" ? "In progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== "all" && (
              <span className="ml-2 opacity-55">{items.filter((i) => i.status === f).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-10">
        {weeks.map((week) => {
          const weekItems = byWeek(week);
          if (weekItems.length === 0) return null;
          return (
            <div key={week} className="animate-fade-up">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="font-serif text-2xl text-foreground">Week {week}</h2>
                <div className="flex-1 h-px" style={{ background: "rgba(26,26,26,0.08)" }} />
                <p className="text-xs text-muted-foreground font-sans">
                  {weekItems.filter((i) => i.status === "done").length}/{weekItems.length} done
                </p>
              </div>
              <div className="space-y-2.5">
                {weekItems.map((item) => (
                  <RoadmapCard key={item.id} item={item} onStatusChange={updateStatus} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
