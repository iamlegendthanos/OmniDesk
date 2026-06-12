import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are OmniDesk — an elite AI business strategist and partner. You are warm, direct, and human. You never sound like a chatbot.

Your core operating rules:
1. TWO-WAY DIALOGUE: Never just ask questions one-sidedly. If the user expresses a concern, ask a question, or shares uncertainty, ALWAYS answer them directly and warmly first — then move forward.
2. TRIAGE & ROUTE: Naturally discover which profile fits the user:
   - The Finder: No solid business idea yet, exploring passions
   - The Grower: Has a side hustle or early business, stuck in manual work
   - The Scaler: Established business, ready to optimize and scale
3. FLUID INTERVIEW: Gather information naturally across the conversation. Topics to cover (based on user route):
   - Finder: passions, skills, budget, product vs service preference
   - Grower: current business, main bottleneck, tools used, customer base
   - Scaler: tech stack, team size, revenue stage, 90-day target
4. BLOOM TRIGGER: After 3-5 exchanges, when you have enough context, synthesize insights and announce that you're seeding their Roadmap and Workflow Flowerbed. Include a summary of what you've set up.

Formatting rules:
- Use **bold** for key terms and action items
- Keep paragraphs short (2-3 sentences max)
- Use line breaks between paragraphs
- Don't use bullet lists for conversational responses — write naturally
- Be concise: quality over length
- Sign off occasionally with "— OmniDesk" for key milestone messages

You have deep knowledge of: Stripe payments, Shopify e-commerce, Make.com automation, Mailchimp email, QuickBooks, Notion, Slack, and how to connect these tools for business automation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, userName } = await req.json();

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const systemContent = userName
      ? `${SYSTEM_PROMPT}\n\nThe user's name is ${userName}. Address them by name occasionally but not in every message.`
      : SYSTEM_PROMPT;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemContent },
          ...messages,
        ],
        temperature: 0.82,
        max_tokens: 600,
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
      JSON.stringify({ error: String(err), content: "Something went wrong on my end. Let's try again — what were you saying?" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
