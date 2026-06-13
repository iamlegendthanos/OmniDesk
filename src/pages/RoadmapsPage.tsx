import { useState } from "react";
import { useRoadmap } from "@/hooks/useRoadmap";
import type { RoadmapItem } from "@/types";
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp, Calendar, List } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  done: { label: "Done", icon: CheckCircle, color: "text-omni-leaf", bg: "bg-omni-leaf/10", dot: "bg-omni-leaf" },
  in_progress: { icon: Clock, label: "In progress", color: "text-omni-gold", bg: "bg-omni-gold/10", dot: "bg-omni-gold" },
  pending: { icon: Circle, label: "Pending", color: "text-muted-foreground", bg: "bg-muted/50", dot: "bg-muted-foreground opacity-30" },
};

/* ─────────────────────────────────────────────────────────────
   ROADMAP CARD (LIST VIEW)
───────────────────────────────────────────────────────────── */
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
        {open ? <ChevronUp size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" />}
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
                  item.status === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
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

/* ─────────────────────────────────────────────────────────────
   CALENDAR VIEW
   Roadmap items are mapped to calendar weeks within June 2025
   (Week 1 = first week of current month, etc.)
───────────────────────────────────────────────────────────── */
function CalendarView({ items }: { items: RoadmapItem[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map roadmap week to day ranges in current month
  // Week 1 = days 1-7, Week 2 = days 8-14, Week 3 = days 15-21, Week 4 = days 22-28+
  const getItemsForDay = (day: number): RoadmapItem[] => {
    const week = Math.ceil(day / 7);
    return items.filter((i) => i.week === week);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build grid cells (blanks + days)
  const cells: { day: number | null }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Week indicator: which week each day belongs to
  const weekOf = (d: number) => Math.ceil(d / 7);

  return (
    <div className="animate-fade-up">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-foreground">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-lg font-light"
          >
            ‹
          </button>
          <button
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="text-xs font-sans px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-lg font-light"
          >
            ›
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <span key={key} className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
            {val.label}
          </span>
        ))}
        <span className="flex items-center gap-2 text-xs font-sans text-muted-foreground ml-auto">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted border border-muted-foreground/20" /> Week boundary
        </span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-xs font-sans text-muted-foreground py-2 font-semibold uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return <div key={`blank-${idx}`} className="cal-day other-month rounded-xl" />;
          }
          const dayItems = getItemsForDay(cell.day);
          const wk = weekOf(cell.day);
          // First day of each week gets a left-edge week indicator
          const isWeekStart = cell.day === 1 || (cell.day - 1) % 7 === 0;
          return (
            <div
              key={cell.day}
              className={`cal-day p-2 rounded-xl relative ${isToday(cell.day) ? "today" : ""}`}
            >
              {/* Week badge on week start */}
              {isWeekStart && (
                <span
                  className="absolute -top-0.5 left-1.5 text-[9px] font-sans font-bold text-muted-foreground opacity-50 uppercase tracking-wide"
                >
                  W{wk}
                </span>
              )}

              {/* Day number */}
              <p className={`text-xs font-sans mb-1.5 mt-2 leading-none ${
                isToday(cell.day) ? "font-bold text-foreground" : "text-muted-foreground"
              }`}>
                {cell.day}
              </p>

              {/* Task dots */}
              {dayItems.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {dayItems.slice(0, 4).map((item) => {
                    const cfg = STATUS_CONFIG[item.status];
                    return (
                      <div
                        key={item.id}
                        className={`group relative`}
                        title={item.title}
                      >
                        <span className={`block w-2 h-2 rounded-full ${cfg.dot} cursor-default`} />
                      </div>
                    );
                  })}
                  {dayItems.length > 4 && (
                    <span className="text-[9px] font-sans text-muted-foreground leading-none mt-0.5">+{dayItems.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week breakdown below calendar */}
      <div className="mt-8 space-y-4">
        <h3 className="font-serif text-xl text-foreground">Tasks by week</h3>
        {[1, 2, 3, 4].map((wk) => {
          const wkItems = items.filter((i) => i.week === wk);
          if (wkItems.length === 0) return null;
          const doneCount = wkItems.filter((i) => i.status === "done").length;
          return (
            <div key={wk} className="surface-flat p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold font-sans text-foreground">W{wk}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold font-sans text-foreground">
                    Week {wk}
                    <span className="text-muted-foreground font-normal ml-2">· days {(wk - 1) * 7 + 1}–{Math.min(wk * 7, 30)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-sans">{doneCount}/{wkItems.length} complete</p>
                </div>
                <div className="ml-auto flex-shrink-0 w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-all duration-700"
                    style={{ width: `${wkItems.length > 0 ? (doneCount / wkItems.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {wkItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <span
                      key={item.id}
                      className={`inline-flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
                      {item.title}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROADMAPS PAGE
───────────────────────────────────────────────────────────── */
export default function RoadmapsPage() {
  const { items, loading, updateStatus } = useRoadmap();
  const [filter, setFilter] = useState<"all" | RoadmapItem["status"]>("all");
  const [view, setView] = useState<"list" | "calendar">("list");

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
          <div className="h-full bg-foreground rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* View toggle + filter tabs */}
      <div className="flex items-center gap-3 mb-8 animate-fade-up stagger-2 flex-wrap">
        {/* View switch */}
        <div className="flex items-center gap-1 surface-flat p-1 flex-shrink-0">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-sans rounded-xl transition-all ${
              view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List size={12} /> List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-sans rounded-xl transition-all ${
              view === "calendar" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar size={12} /> Calendar
          </button>
        </div>

        {/* Status filters — only in list view */}
        {view === "list" && (
          <div className="flex gap-2 flex-wrap">
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
        )}
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <CalendarView items={items} />
      ) : (
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
      )}
    </div>
  );
}
