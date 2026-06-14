// Shopify orders/paid webhook receiver + automation runner
// Receives Shopify webhook → appends to Google Sheets + posts Slack notification
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Expect: POST /shopify-webhook?user_id=<uid>
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return new Response("Missing user_id", { status: 400 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Read raw body for HMAC validation (optional - store secret and verify)
  const bodyText = await req.text();
  let order: Record<string, unknown>;
  try {
    order = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log(`Shopify webhook received for user ${userId}, order:`, order.id);

  // Log the incoming event
  await supabase.from("automation_logs").insert({
    user_id: userId,
    provider: "shopify",
    event_type: "orders/paid",
    status: "pending",
    payload: order,
  });

  // Fetch user's OAuth connections
  const { data: connections } = await supabase
    .from("oauth_connections")
    .select("*")
    .eq("user_id", userId)
    .in("provider", ["google_sheets", "slack"])
    .eq("connected", true);

  if (!connections || connections.length === 0) {
    console.log("No active connections for user", userId);
    return new Response("No active connections", { status: 200 });
  }

  const googleConn = connections.find((c) => c.provider === "google_sheets");
  const slackConn = connections.find((c) => c.provider === "slack");

  // ── Extract order data ──
  const orderId = String(order.id ?? "unknown");
  const orderNumber = order.order_number ? `#${order.order_number}` : `#${orderId.slice(-4)}`;
  const customerName = (() => {
    const shipping = order.shipping_address as Record<string, string> | undefined;
    const billing = order.billing_address as Record<string, string> | undefined;
    const customer = order.customer as Record<string, string> | undefined;
    if (shipping?.first_name) return `${shipping.first_name} ${shipping.last_name ?? ""}`.trim();
    if (billing?.first_name) return `${billing.first_name} ${billing.last_name ?? ""}`.trim();
    if (customer?.first_name) return `${customer.first_name} ${customer.last_name ?? ""}`.trim();
    return order.email as string ?? "Unknown Customer";
  })();
  const orderTotal = order.total_price ? `$${order.total_price}` : "$0.00";
  const currency = (order.currency as string) ?? "USD";
  const lineItems = (order.line_items as Array<{ title: string; quantity: number }> | undefined) ?? [];
  const itemsSummary = lineItems.map((i) => `${i.quantity}x ${i.title}`).join(", ") || "No items";
  const shopifyOrderUrl = order.order_status_url as string ?? "";
  const timestamp = new Date().toISOString();

  const errors: string[] = [];

  // ── Action A: Google Sheets append ──
  if (googleConn) {
    try {
      // Refresh access token if needed
      let accessToken = googleConn.access_token;
      if (googleConn.token_expires_at && new Date(googleConn.token_expires_at) < new Date(Date.now() + 60000)) {
        const refreshed = await refreshGoogleToken(googleConn.refresh_token);
        if (refreshed) {
          accessToken = refreshed.access_token;
          await supabase.from("oauth_connections").update({
            access_token: refreshed.access_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          }).eq("id", googleConn.id);
        }
      }

      const spreadsheetId = googleConn.spreadsheet_id;
      if (!spreadsheetId) throw new Error("No spreadsheet_id configured");

      // Append row: [Timestamp, Order ID, Customer, Total, Currency, Items, Shopify URL]
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [[timestamp, orderNumber, customerName, orderTotal, currency, itemsSummary, shopifyOrderUrl]],
          }),
        }
      );

      if (!appendRes.ok) {
        const err = await appendRes.text();
        throw new Error(`Sheets API: ${err}`);
      }

      console.log(`Google Sheets: appended order ${orderNumber}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Google Sheets error:", msg);
      errors.push(`Google Sheets: ${msg}`);
    }
  }

  // ── Action B: Slack notification ──
  if (slackConn) {
    try {
      const channelId = slackConn.channel_id;
      if (!channelId) throw new Error("No channel_id configured");

      const message = {
        channel: channelId,
        text: `🎉 New Order ${orderNumber} received for *${orderTotal}*!`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🎉 *New Order ${orderNumber}* — *${orderTotal} ${currency}*`,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Customer:*\n${customerName}` },
              { type: "mrkdwn", text: `*Items:*\n${itemsSummary}` },
            ],
          },
          ...(shopifyOrderUrl ? [{
            type: "actions",
            elements: [{
              type: "button",
              text: { type: "plain_text", text: "View Order in Shopify" },
              url: shopifyOrderUrl,
            }],
          }] : []),
        ],
      };

      const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${slackConn.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const slackData = await slackRes.json();
      if (!slackData.ok) throw new Error(`Slack API: ${slackData.error}`);
      console.log(`Slack: posted order ${orderNumber} to channel ${channelId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Slack error:", msg);
      errors.push(`Slack: ${msg}`);
    }
  }

  // ── Update log status ──
  const status = errors.length === 0 ? "success" : "failed";
  await supabase.from("automation_logs")
    .update({ status, result: { actions_run: [googleConn && "google_sheets", slackConn && "slack"].filter(Boolean) }, error_message: errors.join("; ") || null })
    .eq("user_id", userId)
    .eq("event_type", "orders/paid")
    .eq("status", "pending");

  // ── Notify user via OmniDesk notifications ──
  if (errors.length === 0) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "integration_change",
      title: `Order ${orderNumber} processed ⚡`,
      message: `${customerName} paid ${orderTotal}. Logged to Google Sheets${slackConn ? " and posted to Slack" : ""}.`,
      metadata: { orderId, orderNumber, orderTotal, customerName },
    });
  }

  return new Response(JSON.stringify({ success: true, status, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    if (data.access_token) return { access_token: data.access_token, expires_in: data.expires_in ?? 3600 };
    return null;
  } catch {
    return null;
  }
}
