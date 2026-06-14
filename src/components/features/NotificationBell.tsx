import { useState, useRef, useEffect } from "react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { Bell, Flower2, CheckCircle, Zap, Sparkles, Check, Trash2, X } from "lucide-react";

const TYPE_CONFIG = {
  bloom_trigger: {
    icon: Flower2,
    color: "text-omni-leaf",
    bg: "bg-omni-leaf/10",
    dot: "bg-omni-leaf",
  },
  roadmap_completion: {
    icon: CheckCircle,
    color: "text-omni-gold",
    bg: "bg-omni-gold/10",
    dot: "bg-omni-gold",
  },
  integration_change: {
    icon: Zap,
    color: "text-omni-bloom",
    bg: "bg-omni-bloom/10",
    dot: "bg-omni-bloom",
  },
  ai_recommendation: {
    icon: Sparkles,
    color: "text-muted-foreground",
    bg: "bg-muted/60",
    dot: "bg-muted-foreground",
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded-xl"
        aria-label="Notifications"
      >
        <Bell size={15} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold font-sans text-background animate-scale-in"
            style={{
              background: "hsl(var(--foreground))",
              borderRadius: "50px",
              padding: "0 3px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] glass-panel animate-fade-up z-[200]"
          style={{ borderRadius: "20px", maxHeight: "480px", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(26,26,26,0.07)" }}
          >
            <div>
              <p className="text-sm font-semibold font-sans text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground font-sans mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-sans text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded-lg"
                  title="Mark all read"
                >
                  <Check size={10} /> All read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded-lg"
                  title="Clear all"
                >
                  <Trash2 size={11} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded-lg"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={28} strokeWidth={1} className="mx-auto text-muted-foreground opacity-30 mb-3" />
                <p className="text-sm font-sans text-muted-foreground">No notifications yet</p>
                <p className="text-xs font-sans text-muted-foreground opacity-60 mt-1">
                  Events will appear here as you use OmniDesk
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((n, idx) => {
                  const cfg = TYPE_CONFIG[n.type];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3.5 hover:bg-muted/40 transition-colors ${!n.read ? "bg-muted/20" : ""}`}
                      style={{
                        borderBottom: idx < notifications.length - 1 ? "1px solid rgba(26,26,26,0.05)" : "none",
                      }}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon size={13} strokeWidth={1.5} className={cfg.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-sans leading-snug ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-sans whitespace-nowrap flex-shrink-0">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
