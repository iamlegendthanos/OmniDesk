import { useState } from "react";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useNotifications } from "@/hooks/useNotifications";
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
   ROADMAP CARD — simplified: only mark done / mark incomplete
   No manual cycling through all statuses
───────────────────────────────────────────────────────────── */
function RoadmapCard({ item, onStatusChange }: {
  item: RoadmapItem;
  onStatusChange: (id: string, s: RoadmapItem["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const Icon = cfg.icon;

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle between done and previous state (in_progress if it was, else pending)
    if (item.status === "done") {
      onStatusChange(item.id, "pending");
    } else {
      onStatusChange(item.id, "done");
    }
  };

  const markInProgress = () => {
    if (item.status !== "done") {
      onStatusChange(item.id, "in_progress");
    }
  };

  return (
    <div className={`surface-flat transition-all duration-200 overflow-hidden ${item.status === "done" ? "opacity-60" : ""}`}>
      <div
        className="px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Done toggle button */}
        <button
          onClick={toggleDone}
          className={`flex-shrink-0 transition-all hover:scale-110 active:scale-95 ${
            item.status === "done" ? "text-omni-leaf" : "text-muted-foreground hover:text-omni-leaf"
          }`}
          title={item.status === "done" ? "Mark incomplete" : "Mark as done"}
        >
          <Icon size={17} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold font-sans text-foreground ${item.status === "done" ? "line-through opacity-70" : ""}`}>
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Week {item.week} · {item.category}</p>
        </div>
        <span className={`text-xs font-sans px-2.5 py-1 rounded-full flex-shrink-0 hidden sm:block ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        {open ? <ChevronUp size={12} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground flex-shrink-0" />}
      </div>
      {open && (
        <div className="px-4 pb-4 animate-fade-up" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed pt-3 mb-4 pl-7">{item.description}</p>
          {/* Only show "Start working" if pending — no manual status cycling */}
          <div className="flex gap-2 pl-7 flex-wrap">
            {item.status === "pending" && (
              <button
                onClick={markInProgress}
                className="px-4 py-2 text-xs font-sans text-omni-gold bg-omni-gold/10 hover:bg-omni-gold/20 transition-colors"
                style={{ borderRadius: "50px" }}
              >
                Start working on this →
              </button>
            )}
            {item.status !== "done" ? (
              <button
                onClick={() => onStatusChange(item.id, "done")}
                className="px-4 py-2 text-xs font-sans font-semibold bg-foreground text-background transition-opacity hover:opacity-80"
                style={{ borderRadius: "50px" }}
              >
                ✓ Mark as done
              </button>
            ) : (
              <button
                onClick={() => onStatusChange(item.id, "pending")}
                className="px-4 py-2 text-xs font-sans text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                style={{ borderRadius: "50px", border: "1px solid rgba(26,26,26,0.10)" }}
              >
                Undo — not done yet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CALENDAR VIEW
───────────────────────────────────────────────────────────── */
function CalendarView({ items }: { items: RoadmapItem[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getItemsForDay = (day: number): RoadmapItem[] => {
    const week = Math.ceil(day / 7);
    return items.filter((i) => i.week === week);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells: { day: number | null }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="animate-fade-up">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl md:text-2xl text-foreground">{monthName}</h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-lg font-light">‹</button>
          <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="text-xs font-sans px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Today</button>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-lg font-light">›</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${val.dot}`} />
            {val.label}
          </span>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] font-sans text-muted-foreground py-2 font-semibold uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.day === null) return <div key={`blank-${idx}`} className="cal-day other-month rounded-xl" />;
          const dayItems = getItemsForDay(cell.day);
          const isWeekStart = cell.day === 1 || (cell.day - 1) % 7 === 0;
          const wk = Math.ceil(cell.day / 7);
          return (
            <div key={cell.day} className={`cal-day p-1.5 rounded-xl relative ${isToday(cell.day) ? "today" : ""}`}>
              {isWeekStart && (
                <span className="absolute -top-0.5 left-1 text-[8px] font-sans font-bold text-muted-foreground opacity-40 uppercase">W{wk}</span>
              )}
              <p className={`text-xs font-sans mb-1 mt-2 leading-none ${isToday(cell.day) ? "font-bold text-foreground" : "text-muted-foreground"}`}>{cell.day}</p>
              {dayItems.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {dayItems.slice(0, 3).map((item) => {
                    const cfg = STATUS_CONFIG[item.status];
                    return <span key={item.id} className={`block w-1.5 h-1.5 rounded-full ${cfg.dot}`} title={item.title} />;
                  })}
                  {dayItems.length > 3 && <span className="text-[8px] font-sans text-muted-foreground">+{dayItems.length - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week breakdown */}
      <div className="mt-7 space-y-3">
        <h3 className="font-serif text-lg md:text-xl text-foreground">Tasks by week</h3>
        {[1, 2, 3, 4].map((wk) => {
          const wkItems = items.filter((i) => i.week === wk);
          if (wkItems.length === 0) return null;
          const doneCount = wkItems.filter((i) => i.status === "done").length;
          return (
            <div key={wk} className="surface-flat p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold font-sans text-foreground">W{wk}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-sans text-foreground">
                    Week {wk} <span className="text-muted-foreground font-normal">{doneCount}/{wkItems.length}</span>
                  </p>
                </div>
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${wkItems.length > 0 ? (doneCount / wkItems.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {wkItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <span key={item.id} className={`inline-flex items-center gap-1 text-[11px] font-sans px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
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
  const { addNotification } = useNotifications();
  const [filter, setFilter] = useState<"all" | RoadmapItem["status"]>("all");
  const [view, setView] = useState<"list" | "calendar">("list");

  const weeks = [1, 2, 3, 4];
  const done = items.filter((i) => i.status === "done").length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
  const byWeek = (w: number) => filtered.filter((i) => i.week === w);

  // Enhanced updateStatus: fires notification on completion
  const handleStatusChange = async (id: string, status: RoadmapItem["status"]) => {
    const item = items.find((i) => i.id === id);
    await updateStatus(id, status);
    if (status === "done" && item) {
      await addNotification(
        "roadmap_completion",
        "Task completed 🎉",
        `You completed "${item.title}" — great progress on your roadmap!`,
        { taskId: id, week: item.week }
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center"><div className="omni-spinner mx-auto mb-4" /><p className="text-sm text-muted-foreground font-sans">Loading roadmap…</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      {/* Header */}
      <div className="mb-7 animate-fade-up">
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-2">Your plan</p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground">30-Day Roadmap</h1>
        <p className="text-muted-foreground font-sans mt-2">
          Tap the circle icon to mark tasks as done. Progress is tracked automatically.
        </p>
      </div>

      {/* Progress card */}
      <div className="surface-card p-5 mb-6 animate-fade-up stagger-1">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold font-sans text-foreground">Overall progress</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{done} of {items.length} milestones done</p>
          </div>
          <p className="font-serif text-3xl md:text-4xl text-foreground">{progress}%</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-foreground rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground font-sans mt-2 opacity-60">
          Tap any task → use "Mark as done" or click the circle icon to complete it
        </p>
      </div>

      {/* View toggle + filter tabs */}
      <div className="flex items-center gap-2 mb-6 animate-fade-up stagger-2 overflow-x-auto pb-1">
        {/* View switch */}
        <div className="flex items-center gap-0.5 surface-flat p-1 flex-shrink-0">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold font-sans rounded-xl transition-all ${
              view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List size={11} /> List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold font-sans rounded-xl transition-all ${
              view === "calendar" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar size={11} /> Calendar
          </button>
        </div>

        {/* Status filters — list view only */}
        {view === "list" && (
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "pending", "in_progress", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs font-semibold font-sans whitespace-nowrap transition-all ${
                  filter === f ? "bg-foreground text-background shadow-card" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={{ borderRadius: "50px", border: filter === f ? "none" : "1px solid rgba(26,26,26,0.10)" }}
              >
                {f === "all" ? "All" : f === "in_progress" ? "In progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && <span className="ml-1.5 opacity-55">{items.filter((i) => i.status === f).length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <CalendarView items={items} />
      ) : (
        <div className="space-y-8">
          {weeks.map((week) => {
            const weekItems = byWeek(week);
            if (weekItems.length === 0) return null;
            return (
              <div key={week} className="animate-fade-up">
                <div className="flex items-center gap-4 mb-3">
                  <h2 className="font-serif text-xl md:text-2xl text-foreground">Week {week}</h2>
                  <div className="flex-1 h-px" style={{ background: "rgba(26,26,26,0.08)" }} />
                  <p className="text-xs text-muted-foreground font-sans">
                    {weekItems.filter((i) => i.status === "done").length}/{weekItems.length} done
                  </p>
                </div>
                <div className="space-y-2">
                  {weekItems.map((item) => (
                    <RoadmapCard key={item.id} item={item} onStatusChange={handleStatusChange} />
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
