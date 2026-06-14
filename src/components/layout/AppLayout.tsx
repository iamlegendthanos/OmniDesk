import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/features/NotificationBell";
import OmniLogo from "@/components/layout/OmniLogo";
import { Menu, Home, MessageCircle, Map, Flower2, Settings } from "lucide-react";

const BOTTOM_NAV = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/roadmaps", icon: Map, label: "Roadmap" },
  { to: "/flowerbed", icon: Flower2, label: "Flowerbed" },
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

      {/* Mobile sidebar overlay (used for hamburger, hidden when bottom nav exists) */}
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

        {/* Page content — add bottom padding on mobile for the nav bar */}
        <main className="flex-1 overflow-y-auto pb-safe md:pb-0" style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
          <div className="md:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ─── TELEGRAM-STYLE MOBILE BOTTOM NAV ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderTop: "1px solid var(--glass-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-stretch h-[60px]">
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200"
                style={{ textDecoration: "none" }}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span
                    className="absolute top-1.5 w-8 h-1 rounded-full animate-scale-in"
                    style={{ background: "hsl(var(--foreground))" }}
                  />
                )}

                {/* Icon container */}
                <div
                  className={`w-10 h-7 flex items-center justify-center transition-all duration-200 ${
                    isActive ? "mt-1" : "mt-2"
                  }`}
                  style={{
                    borderRadius: isActive ? "12px" : "10px",
                    background: isActive ? "hsl(var(--foreground))" : "transparent",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{ color: isActive ? "hsl(var(--background))" : "hsl(var(--muted-foreground))" }}
                  />
                </div>

                {/* Label */}
                <span
                  className="text-[10px] font-sans leading-none transition-all duration-200"
                  style={{
                    color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
