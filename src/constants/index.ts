export const LANGUAGES: { code: string; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "yo", label: "Yoruba", nativeLabel: "Yorùbá" },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa" },
  { code: "ig", label: "Igbo", nativeLabel: "Igbo" },
];

// Globally accessible tools — chosen for worldwide relevance including Africa/Nigeria
export const TOOL_CONFIGS: Record<string, {
  name: string; color: string; bg: string; logo: string; category: string; description: string;
}> = {
  paystack: {
    name: "Paystack",
    color: "#00C3F7",
    bg: "rgba(0,195,247,0.08)",
    logo: "P",
    category: "payments",
    description: "Accept card, bank transfer, USSD, and mobile money payments. Nigeria's leading payment gateway trusted by thousands of businesses.",
  },
  flutterwave: {
    name: "Flutterwave",
    color: "#F5A623",
    bg: "rgba(245,166,35,0.08)",
    logo: "F",
    category: "payments",
    description: "Pan-African payment infrastructure for businesses. Accept payments across 35+ African countries and globally.",
  },
  whatsapp: {
    name: "WhatsApp Business",
    color: "#25D366",
    bg: "rgba(37,211,102,0.08)",
    logo: "W",
    category: "marketing",
    description: "Automate customer messaging, order confirmations, and marketing broadcasts via WhatsApp — the #1 messaging platform in Nigeria.",
  },
  google_workspace: {
    name: "Google Workspace",
    color: "#4285F4",
    bg: "rgba(66,133,244,0.08)",
    logo: "G",
    category: "operations",
    description: "Automate Gmail, Google Sheets, Drive, and Calendar workflows to streamline your business operations.",
  },
  notion: {
    name: "Notion",
    color: "#1A1A1A",
    bg: "rgba(26,26,26,0.06)",
    logo: "N",
    category: "operations",
    description: "Organize knowledge, tasks, and documentation in one connected workspace. Available and works great worldwide.",
  },
  make: {
    name: "Make",
    color: "#6D00CC",
    bg: "rgba(109,0,204,0.08)",
    logo: "M",
    category: "automation",
    description: "Build no-code automation workflows connecting all your tools. Available globally with a generous free tier.",
  },
  mailchimp: {
    name: "Mailchimp",
    color: "#FFE01B",
    bg: "rgba(255,224,27,0.1)",
    logo: "✉",
    category: "marketing",
    description: "Automate email marketing, build sequences, and grow your audience with AI-powered campaigns.",
  },
  instagram: {
    name: "Instagram",
    color: "#E1306C",
    bg: "rgba(225,48,108,0.08)",
    logo: "IG",
    category: "marketing",
    description: "Automate Instagram DMs, post scheduling, and lead capture for your business page.",
  },
  slack: {
    name: "Slack",
    color: "#4A154B",
    bg: "rgba(74,21,75,0.08)",
    logo: "#",
    category: "operations",
    description: "Automate team notifications, alerts, and workflow communication for your growing team.",
  },
  stripe: {
    name: "Stripe",
    color: "#635BFF",
    bg: "rgba(99,91,255,0.08)",
    logo: "S",
    category: "payments",
    description: "Global online payments for businesses serving international markets. Available in 46+ countries.",
  },
  shopify: {
    name: "Shopify",
    color: "#96BF48",
    bg: "rgba(150,191,72,0.08)",
    logo: "🛍",
    category: "ecommerce",
    description: "Launch an online store and sell globally. Works in Nigeria with Paystack or Flutterwave payment integration.",
  },
  quickbooks: {
    name: "QuickBooks",
    color: "#2CA01C",
    bg: "rgba(44,160,28,0.08)",
    logo: "QB",
    category: "finance",
    description: "Automate invoicing, expense tracking, and financial reporting for your business.",
  },
};

// Default nodes seeded for new users — prioritising globally accessible tools
export const DEFAULT_NODES = [
  { node_key: "paystack", label: "Paystack", tool: "paystack" as const, state: "seed" as const, category: "payments" as const, pos_x: 68, pos_y: 22 },
  { node_key: "whatsapp", label: "WhatsApp Biz", tool: "whatsapp" as const, state: "seed" as const, category: "marketing" as const, pos_x: 18, pos_y: 50 },
  { node_key: "make", label: "Make", tool: "make" as const, state: "seed" as const, category: "automation" as const, pos_x: 66, pos_y: 76 },
  { node_key: "notion", label: "Notion", tool: "notion" as const, state: "seed" as const, category: "operations" as const, pos_x: 20, pos_y: 24 },
];

// Seeds available to add from the sidebar panel
export const AVAILABLE_SEEDS = [
  { tool: "flutterwave", label: "Flutterwave" },
  { tool: "mailchimp", label: "Mailchimp" },
  { tool: "instagram", label: "Instagram" },
  { tool: "google_workspace", label: "Google Workspace" },
  { tool: "slack", label: "Slack" },
  { tool: "stripe", label: "Stripe" },
  { tool: "shopify", label: "Shopify" },
  { tool: "quickbooks", label: "QuickBooks" },
];

export const SAMPLE_ROADMAP = [
  { title: "Define your core offer", description: "Clarify what you're selling, to whom, and at what price point. Be specific — a focused offer converts far better than a broad one.", status: "done" as const, week: 1, category: "Strategy", sort_order: 0 },
  { title: "Set up online payments", description: "Connect Paystack or Flutterwave to accept card, bank transfer, and USSD payments from Nigerian and international customers.", status: "in_progress" as const, week: 1, category: "Revenue", sort_order: 1 },
  { title: "Build your landing page", description: "Create a minimal, high-converting page that clearly explains your offer, shows social proof, and has a single call-to-action.", status: "in_progress" as const, week: 2, category: "Marketing", sort_order: 2 },
  { title: "Launch WhatsApp broadcast", description: "Set up a WhatsApp Business account and write a warm introduction message to send to your first 50 contacts.", status: "pending" as const, week: 2, category: "Marketing", sort_order: 3 },
  { title: "Automate order notifications", description: "Use Make to build a workflow: new payment → WhatsApp confirmation to customer → update your Notion tracker automatically.", status: "pending" as const, week: 3, category: "Automation", sort_order: 4 },
  { title: "Build email nurture sequence", description: "Write a 3-email welcome sequence using Mailchimp to onboard new customers and drive repeat purchases.", status: "pending" as const, week: 3, category: "Marketing", sort_order: 5 },
  { title: "First 10 customers outreach", description: "Personally reach out to 10 ideal customers with a tailored pitch — use WhatsApp, Instagram DM, or email based on where they're most active.", status: "pending" as const, week: 4, category: "Sales", sort_order: 6 },
  { title: "Analyse first month data", description: "Review revenue, traffic, conversion metrics, and customer feedback. Identify your best-performing channel and double down on it.", status: "pending" as const, week: 4, category: "Analytics", sort_order: 7 },
];
