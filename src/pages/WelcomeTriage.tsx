import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import OmniLogo from "@/components/layout/OmniLogo";
import { ArrowRight, Sparkles, Target, TrendingUp, Rocket, Flower2, Map } from "lucide-react";
import type { UserOnboarding } from "@/types";

type Step = 1 | 2 | 3;
type UserType = "finder" | "grower" | "scaler";

const USER_TYPES: {
  key: UserType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
}[] = [
  {
    key: "finder",
    icon: <Sparkles size={22} strokeWidth={1.5} />,
    title: "The Finder",
    subtitle: "Zero to idea",
    description: "No business idea yet — OmniDesk will find one based on your passions and skills.",
    accent: "text-omni-gold",
  },
  {
    key: "grower",
    icon: <Target size={22} strokeWidth={1.5} />,
    title: "The Grower",
    subtitle: "Side-hustle to system",
    description: "Have a side hustle or early business — stuck in manual work and ready to automate.",
    accent: "text-omni-leaf",
  },
  {
    key: "scaler",
    icon: <TrendingUp size={22} strokeWidth={1.5} />,
    title: "The Scaler",
    subtitle: "Optimise and expand",
    description: "Running an established business — ready to audit, optimise margins, and scale.",
    accent: "text-omni-bloom",
  },
];

export default function WelcomeTriage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveOnboarding, onboarding } = useOnboarding();
  const [step, setStep] = useState<Step>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);

  // Hard lockout — if already complete, boot to dashboard
  useEffect(() => {
    if (onboarding?.onboarding_complete) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboarding, navigate]);

  const handleComplete = async () => {
    setSaving(true);
    await saveOnboarding({
      user_type: userType ?? undefined,
      primary_goal: goal,
      onboarding_complete: true,
    });
    navigate("/dashboard", { replace: true });
  };

  const progress = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Cinematic orb background */}
      <div
        className="ambient-orb orb-drift"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(234,220,201,0.55) 0%, rgba(255,255,255,0) 70%)",
          top: "5%",
          left: "30%",
          zIndex: 0,
        }}
      />
      <div
        className="ambient-orb orb-drift2"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(245,239,235,0.45) 0%, rgba(255,255,255,0) 70%)",
          bottom: "5%",
          right: "15%",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10 animate-fade-up">
          <div className="flex items-center gap-3">
            <OmniLogo size={32} />
            <span className="font-serif text-lg text-foreground">OmniDesk</span>
          </div>
          <p className="text-xs text-muted-foreground font-sans">Step {step} of 3</p>
        </div>

        {/* Progress track */}
        <div className="h-0.5 bg-muted rounded-full mb-10 animate-fade-up stagger-1 overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-700 ease-out"
            style={{ width: `${step === 1 ? 33 : step === 2 ? 66 : 100}%` }}
          />
        </div>

        {/* Step 1: Persona */}
        {step === 1 && (
          <div className="animate-fade-up stagger-1">
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">Welcome aboard</p>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 leading-tight">
              Where are you right now?
            </h1>
            <p className="text-lg text-muted-foreground font-sans mb-12 leading-relaxed max-w-lg">
              OmniDesk will personalise your workspace, roadmap, and automation garden based on your profile.
            </p>

            <div className="space-y-4 mb-12">
              {USER_TYPES.map((type, i) => (
                <button
                  key={type.key}
                  onClick={() => setUserType(type.key)}
                  className={`
                    w-full flex items-center gap-5 p-6 text-left transition-all duration-300
                    ${userType === type.key
                      ? "bg-foreground text-background shadow-float"
                      : "surface-card hover:shadow-float text-foreground"
                    }
                  `}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${
                    userType === type.key
                      ? "bg-background/15"
                      : "bg-muted"
                  }`}>
                    <span className={userType === type.key ? "text-background" : type.accent}>
                      {type.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-base font-semibold font-sans">{type.title}</span>
                      <span className={`text-xs font-sans ${userType === type.key ? "opacity-50" : "text-muted-foreground"}`}>
                        {type.subtitle}
                      </span>
                    </div>
                    <p className={`text-sm font-sans leading-relaxed ${userType === type.key ? "opacity-70" : "text-muted-foreground"}`}>
                      {type.description}
                    </p>
                  </div>
                  {userType === type.key && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-background/20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-background" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!userType}
              className="btn-pill flex items-center gap-2.5 px-10 py-4 text-base disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="animate-fade-up">
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest mb-4">One honest answer</p>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 leading-tight">
              What's your #1 goal?
            </h1>
            <p className="text-lg text-muted-foreground font-sans mb-10 leading-relaxed max-w-lg">
              No filtering. No perfection needed. This single sentence powers your entire OmniDesk strategy engine.
            </p>

            <div className="surface-card p-6 mb-6">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={
                  userType === "finder"
                    ? "e.g. I want to turn my passion for photography into a real income stream..."
                    : userType === "grower"
                    ? "e.g. I want to stop spending 3 hours a day on admin and actually grow my client base..."
                    : "e.g. I want to hit $50k MRR this quarter by automating our ops and reducing churn..."
                }
                className="w-full h-36 text-sm font-sans bg-transparent text-foreground resize-none outline-none placeholder:text-muted-foreground leading-relaxed"
                autoFocus
              />
            </div>

            <p className="text-xs text-muted-foreground font-sans mb-10">
              The more specific, the better — OmniDesk will use this to build your personalised roadmap.
            </p>

            <div className="flex items-center gap-4">
              <button onClick={() => setStep(1)} className="btn-ghost-pill px-8 py-4 text-sm">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!goal.trim()}
                className="btn-pill flex items-center gap-2.5 px-10 py-4 text-base disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Welcome */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Flower2 size={22} strokeWidth={1.5} className="text-omni-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest">Setup complete</p>
              </div>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 leading-tight">
              Your workspace is blooming.
            </h1>
            <p className="text-lg text-muted-foreground font-sans mb-10 leading-relaxed max-w-lg">
              We've seeded your personalised roadmap and automation garden based on your profile.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                {
                  icon: <Map size={18} strokeWidth={1.5} className="text-omni-gold" />,
                  label: "Roadmap seeded",
                  sub: "8 personalised milestones across 4 weeks",
                  bg: "bg-omni-gold/8",
                },
                {
                  icon: <Flower2 size={18} strokeWidth={1.5} className="text-omni-leaf" />,
                  label: "Flowerbed ready",
                  sub: "4 integration nodes planted, waiting to bloom",
                  bg: "bg-omni-leaf/8",
                },
                {
                  icon: <Rocket size={18} strokeWidth={1.5} className="text-omni-bloom" />,
                  label: "Chat strategy session",
                  sub: "AI partner ready with your context pre-loaded",
                  bg: "bg-omni-bloom/8",
                },
                {
                  icon: <Sparkles size={18} strokeWidth={1.5} className="text-omni-gold" />,
                  label: "Profile activated",
                  sub: `${USER_TYPES.find((t) => t.key === userType)?.title} · ${userType}`,
                  bg: "bg-muted",
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`surface-flat p-5 animate-fade-up`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold font-sans text-foreground mb-1">{item.label}</p>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">{item.sub}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={saving}
              className="btn-pill flex items-center gap-2.5 px-10 py-4 text-base"
            >
              {saving ? "Entering OmniDesk…" : <>Enter OmniDesk <Flower2 size={18} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
