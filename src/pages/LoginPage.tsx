import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth, mapUser } from "@/hooks/useAuth";
import OmniLogo from "@/components/layout/OmniLogo";
import { Loader2, ArrowLeft, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "register" | "otp";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return toast.error("Please fill in all fields.");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (data.user) { login(mapUser(data.user)); navigate("/dashboard"); }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) return toast.error("Please enter your email.");
    setLoading(true);

    // First, check if this email already has an account by attempting sign-in with a dummy password
    // If the error is "Invalid login credentials", the user exists (password just doesn't match)
    // If the error is "Email not confirmed" or similar, user also exists
    const { error: probeError } = await supabase.auth.signInWithPassword({
      email,
      password: "omni__probe__check__2024",
    });

    const probeMsg = probeError?.message?.toLowerCase() ?? "";
    const accountExists =
      probeMsg.includes("invalid login credentials") ||
      probeMsg.includes("email not confirmed") ||
      probeMsg.includes("invalid credentials") ||
      probeMsg.includes("user already registered") ||
      probeMsg.includes("already registered");

    if (accountExists) {
      setLoading(false);
      toast.error("An account with this email already exists.", {
        description: "Please sign in with your password instead.",
        action: {
          label: "Go to login",
          onClick: () => setMode("login"),
        },
        duration: 6000,
      });
      setMode("login");
      return;
    }

    // No account found — proceed with OTP signup
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      // Catch any server-side duplicate detection
      if (
        msg.includes("already registered") ||
        msg.includes("user already") ||
        msg.includes("already exists")
      ) {
        toast.error("This email already has an account.", {
          description: "Please sign in with your password instead.",
          action: { label: "Go to login", onClick: () => setMode("login") },
          duration: 6000,
        });
        setMode("login");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    toast.success("Verification code sent — check your inbox.");
    setMode("otp");
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || !password.trim()) return toast.error("Please fill in the code and a password.");
    setLoading(true);
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (verifyError) { toast.error(verifyError.message); setLoading(false); return; }
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username: email.split("@")[0] },
    });
    if (updateError) { toast.error(updateError.message); setLoading(false); return; }
    if (updateData.user) { login(mapUser(updateData.user)); navigate("/dashboard"); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orb background */}
      <div
        className="ambient-orb orb-drift"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(234,220,201,0.5) 0%, rgba(255,255,255,0) 70%)",
          top: "-10%",
          left: "30%",
        }}
      />
      <div
        className="ambient-orb orb-drift2"
        style={{
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(245,239,235,0.4) 0%, rgba(255,255,255,0) 70%)",
          bottom: "0",
          right: "10%",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground font-sans mb-10 hover:text-foreground transition-colors"
          style={{ borderRadius: "50px" }}
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Card */}
        <div className="glass-card p-10 animate-scale-in">
          {/* Header */}
          <div className="flex items-center gap-3 mb-10">
            <OmniLogo size={32} />
            <div>
              <h1 className="font-serif text-2xl text-foreground">
                {mode === "login" ? "Welcome back." : mode === "register" ? "Create your account." : "Check your email."}
              </h1>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {mode === "login" ? "Sign in to your workspace" : mode === "register" ? "Join OmniDesk — it's free" : `Code sent to ${email}`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mode !== "otp" && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="omni-input"
                onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSendOtp())}
              />
            )}

            {mode === "otp" && (
              <div>
                <p className="text-xs text-muted-foreground font-sans mb-3">Enter the 4-digit code from your email:</p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 4))}
                  placeholder="0000"
                  className="omni-input text-center text-3xl font-serif tracking-[0.6em]"
                  maxLength={4}
                  autoFocus
                />
              </div>
            )}

            {(mode === "login" || mode === "otp") && (
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "otp" ? "Set a password for your account" : "Your password"}
                  className="omni-input pr-12"
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleVerifyOtp())}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            )}

            <button
              onClick={mode === "login" ? handleLogin : mode === "register" ? handleSendOtp : handleVerifyOtp}
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Working…</>
              ) : mode === "login" ? (
                <>Sign in <ArrowRight size={15} /></>
              ) : mode === "register" ? (
                "Send verification code"
              ) : (
                "Verify & activate"
              )}
            </button>
          </div>

          {/* Divider */}
          <div
            className="my-8"
            style={{ height: "1px", background: "rgba(26,26,26,0.08)" }}
          />

          <div className="text-center">
            {mode === "login" ? (
              <p className="text-sm text-muted-foreground font-sans">
                No account?{" "}
                <button onClick={() => setMode("register")} className="text-foreground font-semibold hover:underline">
                  Sign up free
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground font-sans">
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setOtp(""); }} className="text-foreground font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-sans text-center mt-6 opacity-55">
          By continuing, you agree to OmniDesk's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
