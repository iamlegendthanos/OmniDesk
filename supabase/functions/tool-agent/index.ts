/**
 * tool-agent — interprets a user's natural-language instruction for a specific
 * integration tool and tries to execute the requested action via the stored OAuth token.
 *
 * Body: { nodeId, tool, instruction, userId }
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_API_KEY = Deno.env.get("ONSPACE_AI_API_KEY")!;
const AI_BASE_URL = Deno.env.get("ONSPACE_AI_BASE_URL")!;

const AGENT_SYSTEM = `You are the OmniDesk Tool Agent. You interpret a user's natural-language instruction for a specific integration tool and decide what action to take.

Available action types:
- "send_message": send a message/notification to Slack or WhatsApp
- "append_row": append data to a Google Sheets spreadsheet  
- "create_order": create or manage a Shopify order
- "send_email": send an email via Mailchimp
- "fetch_data": retrieve data from a connected tool
- "none": instruction is unclear or cannot be executed automatically

Respond ONLY with valid JSON in this exact format:
{
  "action": "send_message|append_row|create_order|send_email|fetch_data|none",
  "summary": "One sentence describing what you will do",
  "params": { ... relevant parameters for the action ... }
}

Be helpful and interpret the user's intent generously. If they say "tell my team about X" for a Slack integration, that means send_message to Slack. If they say "log this sale" for Google Sheets, that means append_row.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { nodeId, tool, instruction } = body;

    if (!tool || !instruction) return json({ error: "tool and instruction are required" }, 400);

    // 1. Get the AI to interpret the instruction
    const aiRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: AGENT_SYSTEM },
          { role: "user", content: `Tool: ${tool}\nUser instruction: "${instruction}"` },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI API error: ${t}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content ?? "{}";

    let parsed: { action: string; summary: string; params: Record<string, unknown> } = {
      action: "none", summary: "Could not interpret instruction", params: {}
    };
    try {
      // Strip markdown code fences if present
      const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error("Failed to parse AI response:", raw);
    }

    // 2. Get the OAuth connection for this tool
    const { data: connection } = await supabase
      .from("oauth_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", tool)
      .eq("connected", true)
      .maybeSingle();

    // 3. Execute the action if we have a connection
    let result: Record<string, unknown> = { interpreted: parsed.action, summary: parsed.summary };
    let executionStatus = "pending";
    let executionMessage = parsed.summary;

    if (parsed.action === "none") {
      executionStatus = "failed";
      executionMessage = "Could not interpret instruction — please be more specific about what you want to do.";
    } else if (!connection) {
      executionStatus = "failed";
      executionMessage = `${tool} is not connected yet. Please connect it in Settings → Integrations first.`;
    } else {
      // Execute based on action type
      try {
        if (parsed.action === "send_message" && tool === "slack") {
          const msg = (parsed.params?.message as string) || instruction;
          const channelId = connection.channel_id || "general";
          const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${connection.access_token}` },
            body: JSON.stringify({ channel: channelId, text: `🤖 OmniDesk: ${msg}` }),
          });
          const slackData = await slackRes.json();
          if (slackData.ok) {
            executionStatus = "success";
            executionMessage = `Message sent to #${connection.channel_name || "your channel"} on Slack.`;
          } else {
            executionStatus = "failed";
            executionMessage = `Slack error: ${slackData.error || "unknown"}`;
          }
        } else if (parsed.action === "append_row" && tool === "google_sheets") {
          const spreadsheetId = connection.spreadsheet_id;
          if (!spreadsheetId) throw new Error("No spreadsheet ID configured for this connection.");
          const values = parsed.params?.values as string[][] || [[instruction, new Date().toISOString()]];
          const sheetsRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1:append?valueInputOption=USER_ENTERED`,
            {
              method: "POST",
              headers: { "Authorization": `Bearer ${connection.access_token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ values }),
            }
          );
          if (sheetsRes.ok) {
            executionStatus = "success";
            executionMessage = "Row appended to your Google Spreadsheet.";
          } else {
            const errData = await sheetsRes.json();
            executionStatus = "failed";
            executionMessage = `Sheets error: ${errData.error?.message || sheetsRes.statusText}`;
          }
        } else {
          // Unsupported action for this tool — still log it as acknowledged
          executionStatus = "success";
          executionMessage = parsed.summary + " (Action logged — full API integration coming soon for this tool.)";
        }
      } catch (execErr) {
        console.error("Execution error:", execErr);
        executionStatus = "failed";
        executionMessage = `Execution failed: ${execErr instanceof Error ? execErr.message : String(execErr)}`;
      }
    }

    // 4. Log the automation run
    await supabase.from("automation_logs").insert({
      user_id: user.id,
      provider: tool,
      event_type: `agent_instruction:${parsed.action}`,
      status: executionStatus,
      payload: { instruction, parsed_action: parsed.action, params: parsed.params },
      result: { summary: executionMessage },
      error_message: executionStatus === "failed" ? executionMessage : null,
    });

    result = { ...result, status: executionStatus, message: executionMessage };
    return json(result);
  } catch (err) {
    console.error("tool-agent error:", err);
    return json({ error: String(err), status: "failed", message: "Something went wrong — please try again." }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
