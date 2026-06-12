export const LANGUAGES: { code: string; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
];

export const TOOL_CONFIGS = {
  stripe: { name: "Stripe", color: "#635BFF", bg: "rgba(99,91,255,0.08)", logo: "S", category: "sales" },
  shopify: { name: "Shopify", color: "#96BF48", bg: "rgba(150,191,72,0.08)", logo: "🛍", category: "sales" },
  make: { name: "Make", color: "#6D00CC", bg: "rgba(109,0,204,0.08)", logo: "M", category: "operations" },
  mailchimp: { name: "Mailchimp", color: "#FFE01B", bg: "rgba(255,224,27,0.1)", logo: "✉", category: "marketing" },
  quickbooks: { name: "QuickBooks", color: "#2CA01C", bg: "rgba(44,160,28,0.08)", logo: "QB", category: "finance" },
  notion: { name: "Notion", color: "#1A1A1A", bg: "rgba(26,26,26,0.06)", logo: "N", category: "operations" },
  slack: { name: "Slack", color: "#4A154B", bg: "rgba(74,21,75,0.08)", logo: "#", category: "operations" },
};

export const DEFAULT_NODES = [
  { node_key: "stripe", label: "Stripe", tool: "stripe" as const, state: "seed" as const, category: "sales" as const, pos_x: 68, pos_y: 22 },
  { node_key: "shopify", label: "Shopify", tool: "shopify" as const, state: "seed" as const, category: "sales" as const, pos_x: 18, pos_y: 50 },
  { node_key: "make", label: "Make", tool: "make" as const, state: "seed" as const, category: "operations" as const, pos_x: 66, pos_y: 76 },
  { node_key: "mailchimp", label: "Mailchimp", tool: "mailchimp" as const, state: "seed" as const, category: "marketing" as const, pos_x: 20, pos_y: 24 },
];

export const SAMPLE_ROADMAP = [
  { title: "Define your core offer", description: "Clarify what you're selling, to whom, and at what price point.", status: "done" as const, week: 1, category: "Strategy", sort_order: 0 },
  { title: "Set up Stripe payments", description: "Connect Stripe to accept online payments for your products or services.", status: "in_progress" as const, week: 1, category: "Revenue", sort_order: 1 },
  { title: "Build landing page", description: "Create a minimal, high-converting page that explains your offer.", status: "in_progress" as const, week: 2, category: "Marketing", sort_order: 2 },
  { title: "Launch email sequence", description: "Write a 3-email welcome sequence to nurture new subscribers.", status: "pending" as const, week: 2, category: "Marketing", sort_order: 3 },
  { title: "Connect Shopify store", description: "Set up product listings and automate inventory management.", status: "pending" as const, week: 3, category: "Operations", sort_order: 4 },
  { title: "Automate fulfillment with Make", description: "Create a Make scenario to trigger order fulfillment automatically.", status: "pending" as const, week: 3, category: "Automation", sort_order: 5 },
  { title: "First 10 customers outreach", description: "Personally reach out to 10 ideal customers with a tailored pitch.", status: "pending" as const, week: 4, category: "Sales", sort_order: 6 },
  { title: "Analyze first month data", description: "Review revenue, traffic, and conversion metrics to optimize.", status: "pending" as const, week: 4, category: "Analytics", sort_order: 7 },
];
