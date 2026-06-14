import { NavLink, useLocation } from "react-router-dom";
import OmniLogo from "@/components/layout/OmniLogo";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/features/NotificationBell";
import {
  Home, MessageCircle, Map, Flower2, Settings,
  Sun, Moon, LogOut, X, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageCircle, label: "OmniDesk Chat" },
  { to: "/roadmaps", icon: Map, label: "Roadmaps" },
  { to: "/flowerbed", icon: Flower2, label: "Flowerbed" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <aside
      className="h-full flex flex-col glass-panel"
      style={{
        width: mobile ? "280px" : "260px",
        borderRadius: mobile ? "0 20px 20px 0" : "0",
        borderLeft: "none",
        borderTop: "none",
        borderBottom: "none",
      }}
    >
      {/* Logo area */}
      <div
        className="px-6 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <OmniLogo size={32} />
          <div>
            <span className="font-serif text-lg text-foreground leading-none">OmniDesk</span>
            <p className="text-[11px] text-muted-foreground font-sans leading-none mt-0.5 tracking-wide">Business AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Notification bell in sidebar header */}
          <NotificationBell />
          {mobile && onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={mobile ? onClose : undefined}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                isActive ? "bg-background/15" : "bg-muted"
              }`}>
                <Icon size={15} strokeWidth={1.5} />
              </div>
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={12} className="opacity-40" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User + controls */}
      <div
        className="px-4 py-4 flex-shrink-0 space-y-1"
        style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}
      >
        {/* User row */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-sans flex-shrink-0"
              style={{ background: "hsl(var(--omni-warm))", border: "1px solid rgba(26,26,26,0.1)" }}
            >
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold font-sans text-foreground truncate">{user.username}</p>
              <p className="text-[11px] text-muted-foreground font-sans truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 rounded-xl"
        >
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted">
            {theme === "light" ? <Moon size={13} strokeWidth={1.5} /> : <Sun size={13} strokeWidth={1.5} />}
          </div>
          <span className="text-xs">{theme === "light" ? "Espresso mode" : "Light mode"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 rounded-xl"
        >
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted">
            <LogOut size={13} strokeWidth={1.5} />
          </div>
          <span className="text-xs">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
