import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import OmniLogo from "@/components/layout/OmniLogo";
import BloomAnimation from "@/components/landing/BloomAnimation";
import { useTheme } from "@/hooks/useTheme";
import { ArrowRight, Sparkles, Target, TrendingUp, Moon, Sun, Zap } from "lucide-react";
import heroBloom from "@/assets/hero-bloom.jpg";

/* ── Floating typing simulation ── */
function TypingSimulator() {
  const messages = [
    "Let's plant a Stripe seed to automate your billing…",
    "I've seeded your 30-day roadmap. Week 1 starts now.",
    "Your Shopify integration is blooming. 🌸",
    "What's your biggest bottleneck right now?",
  ];
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const msg = messages[idx];
    if (charIdx < msg.length) {
      const t = setTimeout(() => { setDisplayed(msg.slice(0, charIdx + 1)); setCharIdx((c) => c + 1); }, 38);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setIdx((i) => (i + 1) % messages.length); setCharIdx(0); setDisplayed(""); }, 2800);
      return () => clearTimeout(t);
    }
  }, [charIdx, idx]);

  return (
    <div className="glass-panel p-4 max-w-[220px]" style={{ borderRadius: "18px" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
          <OmniLogo size={14} animated={false} />
        </div>
        <span className="text-xs font-semibold font-sans text-foreground">OmniDesk</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-omni-leaf animate-pulse" />
      </div>
      <p className="text-xs font-sans text-muted-foreground leading-relaxed min-h-[48px]">
        {displayed}
        <span className="inline-block w-px h-3 bg-foreground/40 ml-0.5 animate-pulse" />
      </p>
    </div>
  );
}

/* ── Status badge float ── */
function StatusBadge() {
  return (
    <div className="glass-panel px-4 py-2.5 flex items-center gap-2.5" style={{ borderRadius: "50px" }}>
      <span className="text-sm">🌸</span>
      <span className="text-xs font-semibold font-sans text-omni-leaf">3 workflows live</span>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── GLASS NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] h-[76px] flex items-center px-6 md:px-12 transition-all duration-500 ${
          scrolled ? "glass" : "bg-transparent"
        }`}
        style={{ backdropFilter: scrolled ? "blur(24px) saturate(160%)" : "none" }}
      >
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate("/")}>
          <OmniLogo size={34} />
          <span className="font-serif text-xl text-foreground">OmniDesk</span>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {[["#features", "Features"], ["#flowerbed", "Flowerbed"], ["#audience", "Who it's for"]].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted flex-shrink-0"
          >
            {theme === "light" ? <Moon size={15} strokeWidth={1.5} /> : <Sun size={15} strokeWidth={1.5} />}
          </button>
          <Link to="/login" className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans font-medium text-foreground hover:bg-muted transition-all" style={{ borderRadius: "9999px", border: "1px solid rgba(26,26,26,0.12)" }}>
            Sign in
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-sans font-semibold bg-foreground text-background hover:opacity-85 transition-opacity flex-shrink-0" style={{ borderRadius: "9999px", whiteSpace: "nowrap" }}>
            <span className="hidden sm:inline">Launch</span><span className="sm:hidden">Start</span> <Zap size={12} />
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-[76px] overflow-hidden">
        {/* Cinematic orb background */}
        <div
          className="ambient-orb orb-drift"
          style={{
            width: 700,
            height: 700,
            background: "radial-gradient(circle, rgba(234,220,201,0.55) 0%, rgba(255,255,255,0) 70%)",
            top: "-10%",
            left: "20%",
          }}
        />
        <div
          className="ambient-orb orb-drift2"
          style={{
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(245,239,235,0.45) 0%, rgba(255,255,255,0) 70%)",
            bottom: "-5%",
            right: "10%",
          }}
        />

        {/* Very faint hero background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: `url(${heroBloom})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left copy */}
            <div>
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 mb-10 animate-fade-up"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "50px",
                  border: "1px solid rgba(26,26,26,0.08)",
                  fontSize: "12px",
                  fontFamily: "Inter, sans-serif",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-omni-leaf animate-pulse" />
                AI-powered business builder
              </div>

              <h1 className="font-serif text-6xl md:text-7xl lg:text-[82px] text-foreground mb-8 animate-fade-up stagger-1 leading-[1.02]">
                Build a business at the speed of conversation.
              </h1>

              <p className="text-xl text-muted-foreground font-sans mb-12 max-w-lg animate-fade-up stagger-2 leading-relaxed">
                Stop wrestling with software. Just talk to OmniDesk, and watch your business build itself — automations, roadmaps, and integrations, all of it.
              </p>

              <div className="flex flex-wrap gap-4 animate-fade-up stagger-3">
                <Link to="/login" className="btn-pill text-base px-10 py-4 flex items-center gap-2.5">
                  Start Chatting Free <ArrowRight size={18} />
                </Link>
                <a href="#features" className="btn-ghost-pill text-base px-8 py-4">
                  See how it works
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 mt-12 animate-fade-up stagger-4">
                <div className="flex -space-x-2">
                  {["#EADCC9", "#C8D8B4", "#B4C8D8", "#D8C4B4"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background" style={{ background: c }} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-sans">
                  <strong className="text-foreground">2,400+</strong> founders already growing
                </p>
              </div>
            </div>

            {/* Right: 3D Stacked Mockup */}
            <div className="relative flex items-center justify-center animate-fade-up stagger-2 min-h-[480px]">
              {/* Base layer — dashboard preview card */}
              <div
                className="surface-card p-6 w-full max-w-md relative"
                style={{ zIndex: 10 }}
              >
                {/* Mini dashboard header */}
                <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}>
                  <div className="w-6 h-6"><OmniLogo size={22} animated={false} /></div>
                  <span className="text-xs font-semibold font-sans text-foreground">OmniDesk</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {["bg-red-400/70","bg-yellow-400/70","bg-green-400/70"].map((c,i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                    ))}
                  </div>
                </div>

                {/* Sidebar + content mockup */}
                <div className="flex gap-4">
                  {/* Mini sidebar */}
                  <div className="w-20 flex flex-col gap-1 flex-shrink-0">
                    {["Home", "Chat", "Roadmap", "Garden", "Settings"].map((l, i) => (
                      <div key={l} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-sans font-medium transition-all ${i === 0 ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                        {l}
                      </div>
                    ))}
                  </div>

                  {/* Content area */}
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-muted mb-3 w-2/3" />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {["#EADCC9","#C8D8B4","#D8C4D8","#D8D0C4"].map((c,i) => (
                        <div key={i} className="h-12 rounded-xl" style={{ background: c, opacity: 0.5 }} />
                      ))}
                    </div>
                    <BloomAnimation />
                  </div>
                </div>
              </div>

              {/* Float left: Chat bubble */}
              <div
                className="absolute -bottom-8 -left-6 float-anim animate-fade-up stagger-4"
                style={{ zIndex: 50 }}
              >
                <TypingSimulator />
              </div>

              {/* Float right: Status badge */}
              <div
                className="absolute -top-4 -right-4 float-anim animate-fade-up stagger-5"
                style={{ zIndex: 50, animationDelay: "1.5s" }}
              >
                <StatusBadge />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUDIENCE CARDS ── */}
      <section id="audience" className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Who is this for?</p>
          <h2 className="font-serif text-5xl md:text-6xl text-foreground">Every founder. Every stage.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Sparkles size={22} strokeWidth={1.5} />,
              title: "The Finder",
              tag: "Zero to idea",
              body: "Have zero business ideas? OmniDesk interviews you about your passions and hands you a personalised, ready-to-launch roadmap.",
              accent: "text-omni-gold",
              accentBg: "bg-omni-gold/10",
              delay: "stagger-1",
            },
            {
              icon: <Target size={22} strokeWidth={1.5} />,
              title: "The Grower",
              tag: "Side-hustle to system",
              body: "Stuck in a side-hustle? Tell OmniDesk what takes up your time, and let it automate your manual busywork.",
              accent: "text-omni-leaf",
              accentBg: "bg-omni-leaf/10",
              featured: true,
              delay: "stagger-2",
            },
            {
              icon: <TrendingUp size={22} strokeWidth={1.5} />,
              title: "The Scaler",
              tag: "Optimise and expand",
              body: "Ready to break through? Chat with OmniDesk to audit your tech stack, optimise your margins, and scale your operations.",
              accent: "text-omni-bloom",
              accentBg: "bg-omni-bloom/10",
              delay: "stagger-3",
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`relative p-8 animate-fade-up ${card.delay} transition-all duration-300 ${
                card.featured
                  ? "bg-foreground text-background shadow-float"
                  : "surface-card hover:shadow-float"
              }`}
              style={{ borderRadius: "24px" }}
            >
              <div className={`w-12 h-12 rounded-2xl ${card.featured ? "bg-background/15" : card.accentBg} flex items-center justify-center mb-6`}>
                <span className={card.featured ? "text-background" : card.accent}>{card.icon}</span>
              </div>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-serif text-2xl">{card.title}</h3>
                <span className={`text-xs font-sans ${card.featured ? "opacity-50" : "text-muted-foreground"}`}>
                  · {card.tag}
                </span>
              </div>
              <p className={`text-sm font-sans leading-relaxed ${card.featured ? "opacity-70" : "text-muted-foreground"}`}>
                {card.body}
              </p>
              <div className="mt-8">
                <Link
                  to="/login"
                  className={`inline-flex items-center gap-2 text-sm font-semibold font-sans transition-all hover:gap-3 ${
                    card.featured ? "text-background opacity-80 hover:opacity-100" : card.accent
                  }`}
                >
                  Start for free <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOWERBED SECTION ── */}
      <section id="flowerbed" className="py-28 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle orb */}
        <div
          className="ambient-orb"
          style={{
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(234,220,201,0.35) 0%, rgba(255,255,255,0) 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="animate-fade-up">
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-5">Workflow Flowerbed</p>
            <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-7 leading-tight">
              Watch your business bloom. Literally.
            </h2>
            <p className="text-lg text-muted-foreground font-sans mb-10 leading-relaxed">
              Every time OmniDesk automates a task, links a database, or hooks up a payment gateway, your workspace grows. Manage your entire business ecosystem through a living visual garden — not a spreadsheet.
            </p>
            <Link to="/login" className="btn-pill inline-flex items-center gap-2.5 px-10 py-4 text-base">
              Plant your first seed <ArrowRight size={18} />
            </Link>
          </div>

          <div className="surface-card p-8 flex items-center justify-center animate-fade-up stagger-2">
            <BloomAnimation />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <h2 className="font-serif text-5xl text-foreground mb-4">Everything you need to grow.</h2>
          <p className="text-lg text-muted-foreground font-sans max-w-xl mx-auto">One conversation. A complete business system.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: "💬", title: "Conversational AI Strategy", body: "A real business partner that interviews you, understands your context, and builds personalised plans — not generic templates." },
            { icon: "🌸", title: "Living Workflow Canvas", body: "Watch your integrations bloom from seeds to live API connections. Visual feedback for every automation milestone." },
            { icon: "🗺️", title: "30-Day Roadmap Engine", body: "Structured milestones generated from your unique goals, tracked week by week with progress analytics." },
            { icon: "⚡", title: "One-Click Integrations", body: "Connect Stripe, Shopify, Make.com, Mailchimp, and more through a guided OAuth flow with zero code." },
            { icon: "🌙", title: "Espresso Dark Mode", body: "A stunning deep espresso workspace aesthetic for late-night builders who take their business as seriously as their coffee." },
            { icon: "📱", title: "Responsive Everywhere", body: "Full mobile experience with a fluid adaptive layout — manage your business from any device." },
          ].map((f, i) => (
            <div key={f.title} className={`surface-card p-6 animate-fade-up hover:shadow-float transition-all duration-300`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-serif text-xl text-foreground mb-3">{f.title}</h3>
              <p className="text-sm font-sans text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="surface-card p-16 relative overflow-hidden">
            <div
              className="ambient-orb"
              style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(234,220,201,0.4) 0%, transparent 70%)", top: "-100px", left: "50%", transform: "translateX(-50%)" }}
            />
            <div className="relative z-10">
              <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-6">Ready to bloom?</h2>
              <p className="text-lg text-muted-foreground font-sans mb-10 max-w-md mx-auto">
                Join thousands of founders building smarter with OmniDesk. Free to start.
              </p>
              <Link to="/login" className="btn-pill text-base px-12 py-5 inline-flex items-center gap-2.5">
                Start chatting — it's free <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(26,26,26,0.08)" }}>
        <div className="flex items-center gap-3">
          <OmniLogo size={26} animated={false} />
          <span className="text-sm text-muted-foreground font-sans">OmniDesk · AI Business Builder</span>
        </div>
        <p className="text-xs text-muted-foreground font-sans">© {new Date().getFullYear()} OmniDesk. Built to bloom.</p>
      </footer>
    </div>
  );
}
