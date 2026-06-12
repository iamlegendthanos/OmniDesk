import { useState } from "react";
import type { UserOnboarding } from "@/types";
import { Flower2, ArrowRight, Sparkles, Target, TrendingUp, Rocket } from "lucide-react";

interface Props {
  onComplete: (data: Partial<UserOnboarding>) => Promise<void>;
  onSkip: () => void;
}

type Step = 1 | 2 | 3;
type UserType = "finder" | "grower" | "scaler";

const USER_TYPES: { key: UserType; icon: React.ReactNode; title: string; subtitle: string; description: string }[] = [
  {
    key: "finder",
    icon: <Sparkles size={20} strokeWidth={1.5} />,
    title: "The Finder",
    subtitle: "Zero to idea",
    description: "No business idea yet — want OmniDesk to find one based on your passions.",
  },
  {
    key: "grower",
    icon: <Target size={20} strokeWidth={1.5} />,
    title: "The Grower",
    subtitle: "Side-hustle to system",
    description: "Have a side hustle or early business — stuck in manual work and ready to automate.",
  },
  {
    key: "scaler",
    icon: <TrendingUp size={20} strokeWidth={1.5} />,
    title: "The Scaler",
    subtitle: "Optimise and expand",
    description: "Running an established business — ready to audit, optimise, and scale operations.",
  },
];

export default function OnboardingModal({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    await onComplete({ user_type: userType ?? undefined, primary_goal: goal, onboarding_complete: true });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 animate-overlay-in" onClick={step < 3 ? undefined : onSkip} />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-lg glass-card animate-scale-in">
        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-foreground transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 omni-border-b">
          <div className="flex items-center gap-3 mb-1">
            <Flower2 size={18} strokeWidth={1.5} className="text-omni-gold" />
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-widest">
              Step {step} of 3
            </p>
          </div>
          <h2 className="font-serif text-2xl text-foreground">
            {step === 1 && "Where are you right now?"}
            {step === 2 && "What's your #1 goal?"}
            {step === 3 && "Your workspace is blooming. 🌸"}
          </h2>
          <p className="text-sm text-muted-foreground font-sans mt-2">
            {step === 1 && "Pick the profile that fits you best — OmniDesk will personalise everything from here."}
            {step === 2 && "One honest sentence about what you most want to achieve. No filtering."}
            {step === 3 && "We've seeded your Roadmap and Workflow Flowerbed with a personalised starting point."}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Step 1: User type */}
          {step === 1 && (
            <div className="space-y-3">
              {USER_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setUserType(type.key)}
                  className={`
                    w-full flex items-start gap-4 p-4 text-left transition-all duration-200
                    ${userType === type.key
                      ? "bg-foreground text-background"
                      : "omni-border hover:bg-accent text-foreground"
                    }
                  `}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${userType === type.key ? "text-background" : "text-muted-foreground"}`}>
                    {type.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium font-sans">{type.title}</span>
                      <span className={`text-xs font-sans ${userType === type.key ? "opacity-60" : "text-muted-foreground"}`}>
                        · {type.subtitle}
                      </span>
                    </div>
                    <p className={`text-xs font-sans leading-relaxed ${userType === type.key ? "opacity-75" : "text-muted-foreground"}`}>
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Goal input */}
          {step === 2 && (
            <div className="space-y-4">
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
                className="w-full h-32 px-4 py-3 text-sm font-sans bg-background text-foreground omni-border focus:outline-none focus:ring-1 focus:ring-foreground placeholder:text-muted-foreground resize-none"
                autoFocus
              />
              <p className="text-xs text-muted-foreground font-sans">
                This powers OmniDesk's strategy engine. The more specific, the better.
              </p>
            </div>
          )}

          {/* Step 3: Welcome */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Map />, label: "Roadmap seeded", sub: "8 personalised milestones across 4 weeks" },
                  { icon: <Flower2 />, label: "Flowerbed ready", sub: "4 integration nodes planted and waiting" },
                ].map(({ label, sub, icon }) => (
                  <div key={label} className="omni-border p-4 bg-card">
                    <div className="text-omni-gold mb-2">{icon}</div>
                    <p className="text-xs font-medium font-sans text-foreground mb-0.5">{label}</p>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="omni-border p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket size={14} strokeWidth={1.5} className="text-omni-leaf" />
                  <p className="text-xs font-medium font-sans text-foreground">Recommended first step</p>
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Start a strategy session in <strong>OmniDesk Chat</strong> — your AI partner will build on this context to give you a personalised action plan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button onClick={onSkip} className="text-xs text-muted-foreground font-sans hover:text-foreground transition-colors">
            {step === 3 ? "Skip for now" : "Set up later"}
          </button>

          <button
            onClick={step === 3 ? handleComplete : () => setStep((s) => (s + 1) as Step)}
            disabled={(step === 1 && !userType) || (step === 2 && !goal.trim()) || saving}
            className="btn-primary flex items-center gap-2 text-sm px-6 py-3"
          >
            {step === 3 ? (
              saving ? "Saving…" : <>Enter OmniDesk <Flower2 size={14} /></>
            ) : (
              <>Continue <ArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Fix missing import
function Map(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
