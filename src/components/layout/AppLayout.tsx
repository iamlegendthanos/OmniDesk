import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { Menu } from "lucide-react";
import OmniLogo from "@/components/layout/OmniLogo";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
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
          className="md:hidden flex items-center gap-4 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(26,26,26,0.08)", background: "hsl(var(--background))" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-foreground rounded-xl hover:bg-muted transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <OmniLogo size={26} animated={false} />
            <span className="font-serif text-lg text-foreground">OmniDesk</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
