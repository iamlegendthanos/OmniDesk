/**
 * OAuthCallback — loaded inside the OAuth popup window after the provider
 * redirects back to PUBLIC_APP_URL/oauth/callback?oauth_success=... or ?oauth_error=...
 *
 * This page simply posts a message to the parent window (the main app) and closes itself.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import OmniLogo from "@/components/layout/OmniLogo";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const success = params.get("oauth_success");
  const error = params.get("oauth_error");

  useEffect(() => {
    const message = success
      ? { type: "OAUTH_SUCCESS", provider: success }
      : { type: "OAUTH_ERROR", error: error ?? "unknown" };

    // Notify parent window
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin);
    }

    // Close popup after a brief delay so user sees the status
    const t = setTimeout(() => window.close(), 1200);
    return () => clearTimeout(t);
  }, [success, error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-scale-in">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <OmniLogo size={28} animated={false} />
        </div>
        {success ? (
          <>
            <p className="font-serif text-2xl text-foreground mb-2">Connected! 🌸</p>
            <p className="text-sm text-muted-foreground font-sans">
              <strong className="text-foreground capitalize">{success.replace("_", " ")}</strong> is now live in OmniDesk.
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-xl text-foreground mb-2">Connection failed</p>
            <p className="text-sm text-muted-foreground font-sans">{error ?? "Something went wrong. Please try again."}</p>
          </>
        )}
        <p className="text-xs text-muted-foreground font-sans mt-5 opacity-50">Closing window…</p>
      </div>
    </div>
  );
}
