// OAuth handler: initiates and handles callbacks for Shopify, Google Sheets, Slack
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Provider credentials ──
const SHOPIFY_CLIENT_ID = Deno.env.get("SHOPIFY_CLIENT_ID") ?? "";
const SHOPIFY_CLIENT_SECRET = Deno.env.get("SHOPIFY_CLIENT_SECRET") ?? "";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const SLACK_CLIENT_ID = Deno.env.get("SLACK_CLIENT_ID") ?? "";
const SLACK_CLIENT_SECRET = Deno.env.get("SLACK_CLIENT_SECRET") ?? "";

const BASE_URL = Deno.env.get("PUBLIC_APP_URL") ?? SUPABASE_URL.replace("qnmkqfcybdyassbfqnmk.backend", "https://qnmkqfcybdyassbfqnmk.backend");
const REDIRECT_BASE = `${SUPABASE_URL}/functions/v1/oauth-handler`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/.*\/oauth-handler/, "");

  try {
    // ── INITIATE: POST /initiate ──
    if (req.method === "POST" && (path === "/initiate" || path === "")) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      if (!token) return json({ error: "Unauthorized" }, 401);

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return json({ error: "Unauthorized" }, 401);

      const body = await req.json();
      const { provider, shop_domain, spreadsheet_id } = body;

      // Build state param (encodes user id + provider)
      const stateData = { userId: user.id, provider, shop_domain, spreadsheet_id, ts: Date.now() };
      const state = btoa(JSON.stringify(stateData));
      const redirectUri = `${REDIRECT_BASE}/callback`;

      let authUrl = "";

      if (provider === "shopify") {
        if (!shop_domain) return json({ error: "shop_domain required for Shopify" }, 400);
        const scopes = "read_orders,read_products,read_customers";
        authUrl = `https://${shop_domain}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      } else if (provider === "google_sheets") {
        const scopes = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email";
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
      } else if (provider === "slack") {
        const scopes = "channels:read,chat:write,channels:join";
        authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      } else {
        return json({ error: `Unknown provider: ${provider}` }, 400);
      }

      return json({ authUrl, state });
    }

    // ── CALLBACK: GET /callback ──
    if (req.method === "GET" && path === "/callback") {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        return redirectToApp(`/settings?oauth_error=${encodeURIComponent(error)}`);
      }
      if (!code || !stateParam) {
        return redirectToApp("/settings?oauth_error=missing_params");
      }

      let stateData: { userId: string; provider: string; shop_domain?: string; spreadsheet_id?: string };
      try {
        stateData = JSON.parse(atob(stateParam));
      } catch {
        return redirectToApp("/settings?oauth_error=invalid_state");
      }

      const { userId, provider, shop_domain, spreadsheet_id } = stateData;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const redirectUri = `${REDIRECT_BASE}/callback`;

      // ── Exchange code for token ──
      let tokenData: Record<string, string> = {};

      if (provider === "shopify") {
        const res = await fetch(`https://${shop_domain}/admin/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: SHOPIFY_CLIENT_ID, client_secret: SHOPIFY_CLIENT_SECRET, code }),
        });
        const data = await res.json();
        if (data.access_token) {
          tokenData = { access_token: data.access_token, scope: data.scope };
        }
      } else if (provider === "google_sheets") {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri, grant_type: "authorization_code",
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          tokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? "",
            scope: data.scope ?? "",
          };
          if (data.expires_in) {
            const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
            tokenData.token_expires_at = expiresAt;
          }
        }
      } else if (provider === "slack") {
        const res = await fetch("https://slack.com/api/oauth.v2.access", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code, client_id: SLACK_CLIENT_ID, client_secret: SLACK_CLIENT_SECRET,
            redirect_uri: redirectUri,
          }),
        });
        const data = await res.json();
        if (data.ok && data.access_token) {
          tokenData = {
            access_token: data.access_token,
            channel_id: data.incoming_webhook?.channel_id ?? "",
            channel_name: data.incoming_webhook?.channel ?? "",
            scope: data.scope ?? "",
          };
        }
      }

      if (!tokenData.access_token) {
        console.error(`OAuth token exchange failed for ${provider}`);
        return redirectToApp("/settings?oauth_error=token_exchange_failed");
      }

      // ── Upsert connection record ──
      const upsertPayload: Record<string, unknown> = {
        user_id: userId,
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        scope: tokenData.scope ?? null,
        connected: true,
        updated_at: new Date().toISOString(),
      };
      if (provider === "shopify") upsertPayload.shop_domain = shop_domain;
      if (provider === "google_sheets") {
        upsertPayload.spreadsheet_id = spreadsheet_id ?? null;
        if (tokenData.token_expires_at) upsertPayload.token_expires_at = tokenData.token_expires_at;
      }
      if (provider === "slack") {
        upsertPayload.channel_id = tokenData.channel_id;
        upsertPayload.channel_name = tokenData.channel_name;
      }

      const { error: upsertError } = await supabase
        .from("oauth_connections")
        .upsert(upsertPayload, { onConflict: "user_id,provider" });

      if (upsertError) {
        console.error("upsert error:", upsertError);
        return redirectToApp("/settings?oauth_error=save_failed");
      }

      // Seed notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "integration_change",
        title: `${capitalize(provider.replace("_", " "))} connected 🌸`,
        message: `Your ${capitalize(provider.replace("_", " "))} integration is now live in OmniDesk.`,
        metadata: { provider },
      });

      return redirectToApp(`/settings?oauth_success=${provider}`);
    }

    // ── DISCONNECT: POST /disconnect ──
    if (req.method === "POST" && path === "/disconnect") {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      if (!token) return json({ error: "Unauthorized" }, 401);

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return json({ error: "Unauthorized" }, 401);

      const { provider } = await req.json();
      await supabase.from("oauth_connections").update({ connected: false, access_token: null, refresh_token: null }).eq("user_id", user.id).eq("provider", provider);
      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("oauth-handler error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function redirectToApp(path: string) {
  // Redirect to the frontend app
  const appUrl = Deno.env.get("PUBLIC_APP_URL") ?? "https://qnmkqfcybdyassbfqnmk.onspace.app";
  return new Response(null, {
    status: 302,
    headers: { Location: `${appUrl}${path}` },
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
