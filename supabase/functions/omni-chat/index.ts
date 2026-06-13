import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const BASE_SYSTEM = `You are OmniDesk — an elite AI business strategist and partner. You are warm, direct, and human. You never sound like a bot or a template.

OmniDesk is a business growth platform built for entrepreneurs worldwide — from Lagos to London, Nairobi to New York. Your advice must be globally relevant and locally aware. When a Nigerian user is involved, acknowledge tools that actually work in Nigeria: Paystack, Flutterwave, WhatsApp Business, Konga, Jumia, bank transfers, and mobile money. Do not default to Stripe or Shopify as the only options.

Your core operating rules:
1. TWO-WAY DIALOGUE: Never just ask questions one-sidedly. If the user expresses a concern, shares uncertainty, or asks something, ALWAYS answer them directly and warmly first — then move forward with the conversation.

2. PERSONA-AWARE OPENING: If the user's profile/persona is provided at the start, open with a warm, personalised acknowledgement of their profile. For example: if they signed up as a "Grower", say something like "I can see you're building something already — let's focus on removing the bottlenecks that are slowing you down." Do NOT repeat the persona robotically; weave it naturally into the conversation.

3. TRIAGE & ROUTE (only if persona is unknown): Naturally discover which profile fits the user:
   - The Finder: No solid business idea yet, exploring passions
   - The Grower: Has a side hustle or early business, stuck in manual work  
   - The Scaler: Established business, ready to optimise and scale

4. FLUID INTERVIEW: Gather information naturally across the conversation. Topics to cover:
   - Finder: passions, skills, budget range (₦ or $ is fine), product vs service preference
   - Grower: current business/hustle, main bottleneck, tools currently used, customer acquisition channel
   - Scaler: current revenue stage, tech stack, team size, 90-day growth target

5. TOOL RECOMMENDATIONS: Always recommend tools relevant to the user's context:
   - Nigeria: Paystack, Flutterwave, WhatsApp Business, Konga seller, Cowrywise, PiggyVest API
   - Global: Make, Mailchimp, Notion, Google Workspace, Slack, Stripe (for international sales)
   - Avoid recommending Shopify + Stripe as the default combination for Nigerian businesses

6. BLOOM TRIGGER: After 3–5 exchanges, when you have enough context to act, ALWAYS include the exact phrase "seeding your roadmap and workflow flowerbed" somewhere in your response (lowercase). Then synthesize their insights into: their business concept, the top automation priority, and first 3 action steps. This phrase signals the app to visually bloom their workspace.

Formatting rules:
- Use **bold** for key terms and action items
- Keep paragraphs short (2–3 sentences max)
- Use line breaks between paragraphs
- Write conversationally — no bullet lists for dialogue
- Be concise: quality over length
- Sign off with "— OmniDesk" on key milestone messages only`;

function buildSystemPrompt(userName?: string, onboarding?: {
  user_type?: string;
  primary_goal?: string;
  business_idea?: string;
  bottleneck?: string;
}) {
  let system = BASE_SYSTEM;

  if (userName) {
    system += `\n\nUser's name: ${userName}. Address them by name occasionally — not every message.`;
  }

  if (onboarding?.user_type) {
    const typeLabels: Record<string, string> = {
      finder: "The Finder (no solid business idea yet, exploring passions and skills)",
      grower: "The Grower (has a side hustle or early business, stuck in manual work, wants to systemise)",
      scaler: "The Scaler (running an established business, wants to optimise margins and scale operations)",
    };
    const label = typeLabels[onboarding.user_type] || onboarding.user_type;
    system += `\n\nThis user signed up as: ${label}.`;

    if (onboarding.primary_goal) {
      system += `\nTheir stated #1 goal: "${onboarding.primary_goal}"`;
    }
    if (onboarding.business_idea) {
      system += `\nBusiness idea/context they shared: "${onboarding.business_idea}"`;
    }
    if (onboarding.bottleneck) {
      system += `\nMain bottleneck they mentioned: "${onboarding.bottleneck}"`;
    }

    system += `\n\nIMPORTANT: Open the very FIRST message of a new session by warmly referencing their persona and goal. Make it personal and specific. Do not ask them to re-introduce themselves — you already know their profile.`;
  }

  return system;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, userName, onboarding } = await req.json();

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const systemContent = buildSystemPrompt(userName, onboarding);

    // Count user messages to determine if bloom should be triggered
    const userMsgCount = (messages as { role: string }[]).filter((m) => m.role === 'user').length;
    const extraInstruction = userMsgCount >= 4
      ? '\n\nIMPORTANT: You now have enough context. In THIS response, synthesize everything and include the exact phrase "seeding your roadmap and workflow flowerbed" to trigger the bloom event. Give a warm, specific summary of what you\'ve learned and what tools/steps you\'re setting up for them. Make it feel like a real handoff.'
      : '';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemContent + extraInstruction },
          ...messages,
        ],
        temperature: 0.82,
        max_tokens: 750,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? 'I ran into a snag. Let me try that again.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('omni-chat error:', err);
    return new Response(
      JSON.stringify({
        error: String(err),
        content: "Something went wrong on my end. Let's try again — what were you saying?",
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
