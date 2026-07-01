export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface UserOnboarding {
  id?: string;
  user_id: string;
  user_type?: "finder" | "grower" | "scaler";
  primary_goal?: string;
  onboarding_complete: boolean;
  business_idea?: string;
  bottleneck?: string;
}

export type Theme = "light" | "dark";
export type Language = "en" | "es" | "fr" | "de" | "pt" | "ja" | "zh";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
  stage?: string;
}

export type NodeState = "seed" | "sprout" | "bloom";

export interface WorkflowNode {
  id: string;
  node_key: string;
  label: string;
  tool: string;
  state: NodeState;
  category: "marketing" | "sales" | "operations" | "finance";
  position: { x: number; y: number };
  uptime?: number;
  workflows?: string[];
  lastSync?: string;
  animating?: boolean;
}

export interface RoadmapItem {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done";
  week: number;
  category: string;
  sort_order?: number;
}
