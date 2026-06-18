import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import WelcomeTriage from "@/pages/WelcomeTriage";
import HomePage from "@/pages/HomePage";
import ChatPage from "@/pages/ChatPage";
import RoadmapsPage from "@/pages/RoadmapsPage";
import FlowerbedPage from "@/pages/FlowerbedPage";
import SettingsPage from "@/pages/SettingsPage";
import OAuthCallback from "@/pages/OAuthCallback";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useEffect } from "react";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="omni-spinner mx-auto mb-5" />
        <p className="text-sm text-muted-foreground font-sans tracking-wide">Loading OmniDesk…</p>
      </div>
    </div>
  );
}

/* Guard that checks onboarding state before allowing dashboard access */
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { onboarding, loading } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we've finished loading AND we have a definitive incomplete state
    // onboarding_complete must be explicitly false (not null/undefined)
    if (!loading && onboarding !== null && onboarding.onboarding_complete === false) {
      navigate("/welcome-triage", { replace: true });
    }
  }, [loading, onboarding, navigate]);

  if (loading) return <LoadingScreen />;

  // Still waiting for DB or mid-redirect — show nothing
  if (!loading && onboarding !== null && onboarding.onboarding_complete === false) return null;

  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Onboarding — only accessible if authenticated */}
      <Route
        path="/welcome-triage"
        element={
          <PrivateRoute>
            <WelcomeTriage />
          </PrivateRoute>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        element={
          <PrivateRoute>
            <OnboardingGuard>
              <AppLayout />
            </OnboardingGuard>
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/roadmaps" element={<RoadmapsPage />} />
        <Route path="/flowerbed" element={<FlowerbedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* OAuth popup callback — public, no auth required */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{ style: { borderRadius: "14px", fontFamily: "Inter, sans-serif" } }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
