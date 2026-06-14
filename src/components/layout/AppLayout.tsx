import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/features/NotificationBell";
import OmniLogo from "@/components/layout/OmniLogo";
import { Menu, Home, Settings, Map } from "lucide-react";

// Mobile bottom nav — 3 items only, Telegram-style
const BOTTOM_NAV = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/roadmaps", icon: Map, label: "Roadmap" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop glass sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden flex">
          <div
            className="absolute inset-0 animate-overlay-in"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 animate-slide-left">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(26,26,26,0.08)",
            background: "hsl(var(--background))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center text-foreground rounded-xl hover:bg-muted transition-colors"
          >
            <Menu size={17} />
          </button>
          <div className="flex items-center gap-2.5 flex-1">
            <OmniLogo size={24} animated={false} />
            <span className="font-serif text-base text-foreground">OmniDesk</span>
          </div>
          <NotificationBell />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto md:pb-0" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
          <Outlet />
        </main>
      </div>

      {/* ─── TELEGRAM-STYLE FLOATING BOTTOM NAV (mobile only) ─── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))", paddingLeft: "16px", paddingRight: "16px" }}
      >
        <nav
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid var(--glass-border)",
            borderRadius: "9999px",
            boxShadow: "var(--shadow-float)",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            width: "fit-content",
            minWidth: "240px",
          }}
        >
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                style={{ textDecoration: "none", flex: 1 }}
              >
                <div
                  className="flex flex-col items-center justify-center gap-1 transition-all duration-250"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    background: isActive ? "hsl(var(--foreground))" : "transparent",
                    minWidth: "72px",
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{ color: isActive ? "hsl(var(--background))" : "hsl(var(--muted-foreground))" }}
                  />
                  <span
                    className="text-[10px] font-sans leading-none transition-all duration-200"
                    style={{
                      color: isActive ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
