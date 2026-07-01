import { useState, useRef, useCallback, useEffect } from "react";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { TOOL_CONFIGS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import type { WorkflowNode, NodeState } from "@/types";
import {
  X, ExternalLink, Zap, Activity, Clock, CheckCircle, Loader2,
  Plus, ZoomIn, ZoomOut, Maximize2, Map, Power, Sparkles,
  Send, AlertCircle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   PARTICLE TRAIL
───────────────────────────────────────────────────────────── */
interface ParticleProps { x1: number; y1: number; x2: number; y2: number; color: string; delay: number; }
function ParticleTrail({ x1, y1, x2, y2, color, delay }: ParticleProps) {
  return (
    <g>
      {[0, 0.33, 0.66].map((offset, i) => (
        <circle key={i} r="2.5" fill={color} opacity="0.7">
          <animateMotion dur="2s" begin={`${delay + offset * 2}s`} repeatCount="indefinite" path={`M ${x1} ${y1} L ${x2} ${y2}`} />
          <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`${delay + offset * 2}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" begin={`${delay + offset * 2}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────
   BLOOM NODE
───────────────────────────────────────────────────────────── */
function FlowNode({ node, onSelect, isSelected, onDragStart }: {
  node: WorkflowNode; onSelect: (n: WorkflowNode) => void;
  isSelected: boolean; onDragStart: (e: React.PointerEvent, nodeId: string) => void;
}) {
  const tool = TOOL_CONFIGS[node.tool];
  if (!tool) return null;
  const isSeed = node.state === "seed";
  const isSprout = node.state === "sprout";
  const isBloom = node.state === "bloom";
  const isAnimating = node.animating;
  const r = isSeed ? 16 : 22;

  return (
    <g
      transform={`translate(${node.position.x - r}, ${node.position.y - r})`}
      style={{ cursor: "grab", userSelect: "none", touchAction: "none" }}
      onClick={() => onSelect(node)}
      onPointerDown={(e) => { e.stopPropagation(); onDragStart(e, node.id); }}
    >
      {isAnimating && (
        <circle cx={r} cy={r} r="4" fill="none" stroke={tool.color} strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="4;44" dur="1.1s" fill="freeze" />
          <animate attributeName="opacity" values="0.7;0" dur="1.1s" fill="freeze" />
        </circle>
      )}
      {isBloom && [0, 51, 102, 153, 204, 255, 306].map((deg, i) => {
        const px = r + Math.cos((deg * Math.PI) / 180) * 26;
        const py = r + Math.sin((deg * Math.PI) / 180) * 26;
        return (
          <ellipse key={i} cx={px} cy={py} rx="9" ry="3.8"
            fill={tool.color} opacity={isAnimating ? 0 : 0.18}
            transform={`rotate(${deg},${px},${py})`}
            className={isAnimating ? "petal-open" : "bloom-pulse"}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        );
      })}
      {isBloom && <circle cx={r} cy={r} r={r + 4} fill={tool.color} opacity="0.07" className="bloom-pulse" />}
      {isSprout && (
        <g>
          <ellipse cx={r + 16} cy={r - 15} rx="6.5" ry="2.8" fill="#5C7A5A" opacity="0.75"
            transform={`rotate(-30,${r + 16},${r - 15})`} className="sprout-pulse" />
          <line x1={r} y1={r - r + 5} x2={r + 12} y2={r - 17} stroke="#5C7A5A" strokeWidth="0.9" opacity="0.6" />
        </g>
      )}
      <circle cx={r} cy={r} r={r}
        fill={isBloom || isSprout ? "hsl(var(--card))" : "hsl(var(--background))"}
        stroke={isSelected ? tool.color : "currentColor"} strokeWidth={isSelected ? "1.5" : "0.8"}
        strokeDasharray={isSeed ? "3 3" : "none"} opacity={isSeed ? 0.35 : 1}
        className={isSeed ? "seed-shimmer" : ""}
      />
      {isSelected && <circle cx={r} cy={r} r={r + 9} fill="none" stroke={tool.color} strokeWidth="0.7" opacity="0.35" strokeDasharray="3 4" />}
      <text x={r} y={r + 6} textAnchor="middle"
        fontSize={isBloom ? "16" : isSprout ? "14" : "12"}
        fill={isBloom ? tool.color : "currentColor"}
        fontFamily="Inter" fontWeight={isBloom ? "700" : "400"}
        opacity={isSeed ? 0.4 : 1}
        className={isAnimating ? "petal-open" : ""}
        style={{ pointerEvents: "none" }}>
        {tool.logo}
      </text>
      <text x={r} y={r * 2 + 15} textAnchor="middle" fontSize="8" fill="currentColor"
        fontFamily="Inter" opacity={isSeed ? 0.35 : 0.65} style={{ pointerEvents: "none" }}>
        {node.label}
      </text>
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────
   CORE POWER OVERLAY — shown when OmniDesk core is clicked
───────────────────────────────────────────────────────────── */
function CoreOverlay({
  bloomedNodes,
  onDisconnectAll,
  onAutoConnect,
  onClose,
  loading,
}: {
  bloomedNodes: WorkflowNode[];
  onDisconnectAll: () => void;
  onAutoConnect: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const hasConnected = bloomedNodes.length > 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div
        className="surface-card p-7 max-w-sm w-full mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center flex-shrink-0">
            <Power size={18} strokeWidth={1.5} className="text-background" />
          </div>
          <div>
            <h3 className="font-serif text-xl text-foreground">OmniDesk Core</h3>
            <p className="text-xs text-muted-foreground font-sans">
              {hasConnected ? `${bloomedNodes.length} tool${bloomedNodes.length > 1 ? "s" : ""} currently live` : "No tools connected yet"}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted">
            <X size={14} />
          </button>
        </div>

        {hasConnected ? (
          <>
            {/* Connected tools list */}
            <div className="space-y-2 mb-6">
              {bloomedNodes.map((n) => {
                const tool = TOOL_CONFIGS[n.tool];
                if (!tool) return null;
                return (
                  <div key={n.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${tool.color}20`, color: tool.color }}>
                      {tool.logo}
                    </span>
                    <span className="text-sm font-sans font-semibold text-foreground flex-1">{tool.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-omni-leaf font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-omni-leaf animate-pulse" />Live
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={onDisconnectAll}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-semibold font-sans transition-all rounded-xl"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                Disconnect all tools
              </button>
              <button onClick={onClose} className="btn-ghost w-full text-sm py-3.5 rounded-xl">
                Keep all connected
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed mb-6">
              Click on any tool node in the flowerbed and plant a seed to start connecting. Once you've connected a tool it will bloom here.
            </p>
            <button onClick={onAutoConnect} disabled={loading} className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Auto-connect recommended tools
            </button>
          </>
        )}

        <p className="text-[11px] text-muted-foreground font-sans text-center mt-4 opacity-60">
          Only available after linking tools via Settings → Integrations
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WORKFLOW AGENT DRAWER — AI-powered instruction panel per tool
───────────────────────────────────────────────────────────── */
const STATE_STEPS = [
  { key: "seed", label: "Seed", desc: "Integration ready to plant", icon: "🌱" },
  { key: "sprout", label: "Sprout", desc: "Authorising & configuring", icon: "🌿" },
  { key: "bloom", label: "Bloom", desc: "Live and flowing data", icon: "🌸" },
];

function StateTimeline({ state }: { state: NodeState }) {
  const currentIdx = STATE_STEPS.findIndex((s) => s.key === state);
  const pct = (currentIdx / (STATE_STEPS.length - 1)) * 100;
  return (
    <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">Connection Journey</p>
      <div className="relative">
        <div className="absolute top-4 left-4 right-4 h-px bg-muted" />
        <div className="absolute top-4 left-4 h-px bg-foreground transition-all duration-700" style={{ width: `${pct}%` }} />
        <div className="relative flex justify-between">
          {STATE_STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ zIndex: 1 }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                  done ? "bg-omni-leaf text-background scale-100" :
                  active ? "bg-foreground text-background scale-110 shadow-md" :
                  "bg-muted text-muted-foreground scale-100"
                }`} style={active ? { boxShadow: "0 0 0 3px hsl(var(--foreground) / 0.15)" } : {}}>
                  {done ? "✓" : step.icon}
                </div>
                <p className={`text-[9px] font-sans text-center font-semibold transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-sans mt-3 text-center">{STATE_STEPS[currentIdx]?.desc}</p>
    </div>
  );
}

interface AgentMessage {
  role: "user" | "agent";
  content: string;
  status?: "success" | "failed" | "pending";
}

function WorkflowDrawer({
  node,
  onClose,
  onConnect,
  isConnecting,
}: {
  node: WorkflowNode | null;
  onClose: () => void;
  onConnect: (id: string, state: NodeState) => void;
  isConnecting: boolean;
}) {
  const { user } = useAuth();
  const [instruction, setInstruction] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!node) return null;
  const tool = TOOL_CONFIGS[node.tool];
  if (!tool) return null;
  const isBloom = node.state === "bloom";
  const isSprout = node.state === "sprout";

  const TOOL_PROMPTS: Record<string, string> = {
    slack: 'e.g. "Tell my team we just hit our weekly revenue target"',
    google_sheets: 'e.g. "Log a new sale: ₦45,000 from John Doe, Lagos"',
    shopify: 'e.g. "Show me today\'s orders" or "Create a discount code"',
    mailchimp: 'e.g. "Send a welcome email to new subscribers"',
    whatsapp: 'e.g. "Broadcast a restock notice to all customers"',
    paystack: 'e.g. "Check this week\'s total revenue"',
    notion: 'e.g. "Add a new task: launch Instagram campaign by Friday"',
    default: `Tell OmniDesk what you want to do with ${tool.name}…`,
  };

  const placeholder = TOOL_PROMPTS[node.tool] ?? TOOL_PROMPTS.default;

  const handleSend = async () => {
    const text = instruction.trim();
    if (!text || agentLoading) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInstruction("");
    setAgentLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("tool-agent", {
      body: { nodeId: node.id, tool: node.tool, instruction: text },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    let agentMsg: AgentMessage = { role: "agent", content: "", status: "failed" };

    if (error) {
      let errMsg = "Something went wrong. Please try again.";
      if (error instanceof FunctionsHttpError) {
        try { const t = await error.context?.text(); errMsg = t || errMsg; } catch {}
      }
      agentMsg = { role: "agent", content: errMsg, status: "failed" };
    } else {
      agentMsg = {
        role: "agent",
        content: data?.message ?? "Action completed.",
        status: (data?.status as "success" | "failed" | "pending") ?? "success",
      };
    }

    setMessages((m) => [...m, agentMsg]);
    setAgentLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-[300px] md:w-[320px] flex flex-col overflow-hidden animate-slide-right"
      style={{
        zIndex: 30,
        background: "hsl(var(--background))",
        borderLeft: "1px solid rgba(26,26,26,0.08)",
      }}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${tool.color}18`, color: tool.color }}>
          {tool.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold font-sans text-foreground">{tool.name}</h3>
          <p className="text-xs text-muted-foreground font-sans capitalize">{node.state} · {node.category}</p>
        </div>
        <button onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted flex-shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* State timeline */}
      <StateTimeline state={node.state} />

      {/* Status */}
      <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div className={`flex items-center gap-2.5 px-4 py-3 text-xs font-sans rounded-xl ${
          isBloom ? "text-omni-leaf bg-omni-leaf/8" : isSprout ? "text-omni-gold bg-omni-gold/8" : "text-muted-foreground bg-muted"
        }`}>
          {isBloom ? <CheckCircle size={12} /> : isSprout ? <Activity size={12} /> : <Clock size={12} />}
          <span className="font-semibold capitalize">{node.state}</span>
          <span className="opacity-55 ml-1">{isBloom ? "· Live & flowing" : isSprout ? "· Configuring" : "· Ready to plant"}</span>
        </div>
      </div>

      {/* Stats (bloom only) */}
      {isBloom && (
        <div className="px-5 py-3 flex-shrink-0 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
          <div className="p-2.5 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
            <p className="font-serif text-xl text-foreground">{node.uptime}%</p>
            <p className="text-[10px] text-muted-foreground font-sans">Uptime</p>
          </div>
          <div className="p-2.5 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
            <p className="font-serif text-xl text-foreground">{node.workflows?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground font-sans">Flows</p>
          </div>
          <div className="p-2.5 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
            <p className="font-serif text-xl text-foreground">99</p>
            <p className="text-[10px] text-muted-foreground font-sans">Score</p>
          </div>
        </div>
      )}

      {/* ── AI WORKFLOW AGENT ── only for bloomed nodes */}
      {isBloom && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Agent intro */}
          <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={11} className="text-omni-gold" />
              <p className="text-[10px] font-semibold font-sans text-foreground uppercase tracking-widest">OmniDesk Agent</p>
            </div>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Tell OmniDesk what to do with {tool.name} in plain English — it will interpret and execute the action.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Sparkles size={16} strokeWidth={1.5} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed px-2">
                  Type an instruction below and the OmniDesk agent will execute it for you.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-3.5 py-2.5 text-xs font-sans leading-relaxed max-w-[90%] ${
                  msg.role === "user"
                    ? "chat-bubble-user"
                    : msg.status === "failed"
                    ? "bg-red-500/10 text-red-400 rounded-2xl rounded-tl-sm"
                    : "chat-bubble-ai text-foreground"
                }`}>
                  {msg.role === "agent" && msg.status && (
                    <span className="flex items-center gap-1 mb-1.5">
                      {msg.status === "success" ? (
                        <><CheckCircle size={10} className="text-omni-leaf" /><span className="text-omni-leaf font-semibold text-[10px]">Done</span></>
                      ) : msg.status === "failed" ? (
                        <><AlertCircle size={10} className="text-red-400" /><span className="text-red-400 font-semibold text-[10px]">Failed</span></>
                      ) : (
                        <><Loader2 size={10} className="animate-spin" /><span className="text-muted-foreground font-semibold text-[10px]">Processing</span></>
                      )}
                    </span>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {agentLoading && (
              <div className="flex items-start">
                <div className="chat-bubble-ai px-4 py-3 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-sans">Agent thinking…</span>
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={2}
                className="flex-1 omni-input resize-none text-xs py-2.5 px-3"
                style={{ borderRadius: "10px", minHeight: "60px", maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!instruction.trim() || agentLoading}
                className="w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-xl flex-shrink-0 transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={13} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-sans mt-1.5 text-center opacity-60">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Non-bloom: CTA section */}
      {!isBloom && (
        <div className="flex-1 flex flex-col">
          {/* Hint */}
          <div className="px-5 py-4 flex-1">
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">About</p>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed mb-4">
              {tool.description || `Connect ${tool.name} to automate your workflows.`}
            </p>
            {!isBloom && (
              <div className="px-4 py-3.5 rounded-xl text-xs font-sans text-muted-foreground leading-relaxed"
                style={{ background: "hsl(var(--muted))" }}>
                {isSprout ? (
                  <><strong className="text-foreground">Next:</strong> Click "Complete setup" to authorise the OAuth connection and go live.</>
                ) : (
                  <><strong className="text-foreground">Next:</strong> Click "Plant seed" to start the Seed → Sprout → Bloom journey.</>
                )}
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="px-5 py-4 space-y-2.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
            {isSprout ? (
              <>
                <button onClick={() => onConnect(node.id, "bloom")} disabled={isConnecting}
                  className="btn-primary w-full text-xs justify-center flex items-center gap-2 py-3.5 rounded-xl">
                  {isConnecting ? <><Loader2 size={13} className="animate-spin" />Authorising…</> : `Complete ${tool.name} setup →`}
                </button>
                <button onClick={() => onConnect(node.id, "seed")} className="btn-ghost w-full text-xs py-3 justify-center rounded-xl">
                  Reset to seed
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onConnect(node.id, "sprout")} disabled={isConnecting}
                  className="btn-primary w-full text-xs justify-center flex items-center gap-2 py-3.5 rounded-xl">
                  {isConnecting ? <><Loader2 size={13} className="animate-spin" />Starting…</> : `🌱 Plant ${tool.name} seed`}
                </button>
                <a href="#" className="btn-ghost w-full text-xs py-3 justify-center flex items-center gap-1.5 rounded-xl"
                  onClick={(e) => e.preventDefault()}>
                  <ExternalLink size={11} /> Learn more
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bloom: extra actions */}
      {isBloom && (
        <div className="px-5 py-3 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
          <button onClick={() => onConnect(node.id, "sprout")}
            className="btn-ghost text-xs py-2.5 flex-1 justify-center rounded-xl">
            Disconnect
          </button>
          <a href="#" onClick={(e) => e.preventDefault()}
            className="btn-primary text-xs flex-1 justify-center flex items-center gap-1.5 py-2.5 rounded-xl">
            <ExternalLink size={11} /> Open {tool.name}
          </a>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MINI MAP OVERLAY
───────────────────────────────────────────────────────────── */
const MINI_W = 140;
const MINI_H = 90;
const CANVAS_SIZE = 1200;
const CORE = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
const NODE_SPREAD = 320;

function getNodePos(posX: number, posY: number) {
  return {
    x: CORE.x + (posX - 50) * (NODE_SPREAD / 50),
    y: CORE.y + (posY - 50) * (NODE_SPREAD / 50),
  };
}

function MiniMap({ nodes, localPositions, transform, viewportW, viewportH }: {
  nodes: WorkflowNode[];
  localPositions: Record<string, { x: number; y: number }>;
  transform: { x: number; y: number; scale: number };
  viewportW: number;
  viewportH: number;
}) {
  const scaleX = MINI_W / CANVAS_SIZE;
  const scaleY = MINI_H / CANVAS_SIZE;
  const vpW = Math.min(MINI_W, (viewportW / transform.scale) * scaleX);
  const vpH = Math.min(MINI_H, (viewportH / transform.scale) * scaleY);
  const vpX = Math.max(0, (-transform.x / transform.scale + CORE.x - viewportW / 2 / transform.scale) * scaleX);
  const vpY = Math.max(0, (-transform.y / transform.scale + CORE.y - viewportH / 2 / transform.scale) * scaleY);

  return (
    <div className="absolute bottom-16 right-4 z-40 animate-scale-in"
      style={{
        background: "hsl(var(--background))",
        border: "1px solid rgba(26,26,26,0.12)",
        borderRadius: "12px",
        padding: "6px",
        boxShadow: "var(--shadow-float)",
      }}>
      <p className="text-[9px] font-sans text-muted-foreground uppercase tracking-widest mb-1.5 px-1">Mini Map</p>
      <svg width={MINI_W} height={MINI_H}
        style={{ display: "block", overflow: "hidden", borderRadius: "8px", background: "hsl(var(--card))" }}>
        {nodes.map((n) => {
          const to = localPositions[n.id] ?? getNodePos(n.position.x, n.position.y);
          return <line key={n.id} x1={CORE.x * scaleX} y1={CORE.y * scaleY} x2={to.x * scaleX} y2={to.y * scaleY}
            stroke="currentColor" strokeWidth="0.5" opacity="0.2" />;
        })}
        <circle cx={CORE.x * scaleX} cy={CORE.y * scaleY} r="5" fill="hsl(var(--foreground))" opacity="0.7" />
        {nodes.map((n) => {
          const tool = TOOL_CONFIGS[n.tool];
          const pos = localPositions[n.id] ?? getNodePos(n.position.x, n.position.y);
          return (
            <circle key={n.id} cx={pos.x * scaleX} cy={pos.y * scaleY} r="4"
              fill={n.state === "bloom" || n.state === "sprout" ? (tool?.color ?? "currentColor") : "currentColor"}
              opacity={n.state === "bloom" ? 0.85 : n.state === "sprout" ? 0.55 : 0.25} />
          );
        })}
        <rect x={vpX} y={vpY} width={vpW} height={vpH} fill="none"
          stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.35" strokeDasharray="3 2" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AVAILABLE SEEDS LIST
───────────────────────────────────────────────────────────── */
const AVAILABLE_SEEDS_LIST = [
  { tool: "flutterwave" as const, label: "Flutterwave" },
  { tool: "slack" as const, label: "Slack" },
  { tool: "google_workspace" as const, label: "Google Workspace" },
  { tool: "mailchimp" as const, label: "Mailchimp" },
  { tool: "instagram" as const, label: "Instagram" },
  { tool: "shopify" as const, label: "Shopify" },
];

/* ─────────────────────────────────────────────────────────────
   FLOWERBED PAGE
───────────────────────────────────────────────────────────── */
export default function FlowerbedPage() {
  const { nodes, loading, updateNodeState, refetch } = useWorkflowNodes();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [seedsOpen, setSeedsOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [coreOverlayOpen, setCoreOverlayOpen] = useState(false);
  const [coreLoading, setCoreLoading] = useState(false);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.7 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const draggingNodeId = useRef<string | null>(null);
  const dragStartPos = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (nodes.length > 0) {
      const pos: Record<string, { x: number; y: number }> = {};
      nodes.forEach((n) => { pos[n.id] = getNodePos(n.position.x, n.position.y); });
      setLocalPositions(pos);
    }
  }, [nodes.length]);

  const getNodeCenter = (node: WorkflowNode) =>
    localPositions[node.id] ?? getNodePos(node.position.x, node.position.y);

  const zoom = useCallback((delta: number) => {
    setTransform((t) => ({ ...t, scale: Math.min(2.5, Math.max(0.25, t.scale + delta)) }));
  }, []);

  const fitAll = useCallback(() => {
    if (!canvasRef.current) { setTransform({ x: 0, y: 0, scale: 0.7 }); return; }
    const vw = canvasRef.current.clientWidth;
    const vh = canvasRef.current.clientHeight;
    const allX = nodes.map((n) => getNodeCenter(n).x).concat([CORE.x]);
    const allY = nodes.map((n) => getNodeCenter(n).y).concat([CORE.y]);
    const minX = Math.min(...allX) - 60;
    const maxX = Math.max(...allX) + 60;
    const minY = Math.min(...allY) - 60;
    const maxY = Math.max(...allY) + 60;
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const newScale = Math.min(2, Math.max(0.25, Math.min(vw / contentW, vh / contentH) * 0.85));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setTransform({ x: vw / 2 - centerX * newScale, y: vh / 2 - centerY * newScale, scale: newScale });
  }, [nodes, localPositions]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY > 0 ? -0.08 : 0.08);
  }, [zoom]);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (draggingNodeId.current) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingNodeId.current) {
      const dx = (e.clientX - dragStartPos.current.mx) / transform.scale;
      const dy = (e.clientY - dragStartPos.current.my) / transform.scale;
      setLocalPositions((prev) => ({
        ...prev,
        [draggingNodeId.current!]: { x: dragStartPos.current.nx + dx, y: dragStartPos.current.ny + dy },
      }));
    } else if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTransform((t) => ({ ...t, x: panStart.current.tx + dx, y: panStart.current.ty + dy }));
    }
  }, [transform.scale]);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
    draggingNodeId.current = null;
    setDraggingId(null);
  }, []);

  const handleNodeDragStart = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.preventDefault();
    draggingNodeId.current = nodeId;
    setDraggingId(nodeId);
    const cur = localPositions[nodeId];
    dragStartPos.current = { mx: e.clientX, my: e.clientY, nx: cur?.x ?? CORE.x, ny: cur?.y ?? CORE.y };
    (e.target as SVGElement).closest("svg")?.setPointerCapture?.(e.pointerId);
  }, [localPositions]);

  const handleConnect = async (id: string, newState: NodeState) => {
    setIsConnecting(true);
    await new Promise((r) => setTimeout(r, 1400));
    updateNodeState(id, newState);
    setIsConnecting(false);
    const found = nodes.find((n) => n.id === id);
    if (found) setSelectedNode({ ...found, state: newState });
  };

  // Disconnect all bloomed nodes
  const handleDisconnectAll = async () => {
    setCoreLoading(true);
    const bloomedNodes = nodes.filter((n) => n.state === "bloom");
    for (const node of bloomedNodes) {
      await updateNodeState(node.id, "seed");
      await new Promise((r) => setTimeout(r, 400));
    }
    setCoreLoading(false);
    setCoreOverlayOpen(false);
    await refetch();
  };

  // Auto-connect sprouting nodes to bloom
  const handleAutoConnect = async () => {
    setCoreLoading(true);
    const sprouts = nodes.filter((n) => n.state === "sprout");
    if (sprouts.length === 0) {
      // Move first 2 seeds to sprout for demo
      const seeds = nodes.filter((n) => n.state === "seed").slice(0, 2);
      for (const node of seeds) {
        await updateNodeState(node.id, "sprout");
        await new Promise((r) => setTimeout(r, 600));
      }
    } else {
      for (const node of sprouts) {
        await updateNodeState(node.id, "bloom");
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    setCoreLoading(false);
    setCoreOverlayOpen(false);
  };

  const bloomCount = nodes.filter((n) => n.state === "bloom").length;
  const sproutCount = nodes.filter((n) => n.state === "sprout").length;
  const bloomedNodes = nodes.filter((n) => n.state === "bloom");
  const vw = canvasRef.current?.clientWidth ?? 800;
  const vh = canvasRef.current?.clientHeight ?? 600;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="omni-spinner mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-sans">Loading your flowerbed…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-8 py-3.5 flex items-center gap-3 flex-shrink-0 flex-wrap gap-y-2"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}>
        <div className="min-w-0">
          <h1 className="font-serif text-xl md:text-2xl text-foreground">Workflow Flowerbed</h1>
          <p className="text-[11px] text-muted-foreground font-sans mt-0.5 hidden sm:block">
            Scroll to zoom · Drag to pan · Click a node to talk to it
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex items-center gap-3 text-xs font-sans text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-omni-leaf" />{bloomCount} live</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-omni-gold" />{sproutCount} sprouting</span>
          </div>
          <div className="flex items-center gap-0.5 surface-flat p-1">
            <button onClick={() => zoom(-0.15)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              <ZoomOut size={12} />
            </button>
            <span className="text-[11px] font-sans text-muted-foreground px-1.5 min-w-[36px] text-center">
              {Math.round(transform.scale * 100)}%
            </span>
            <button onClick={() => zoom(0.15)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              <ZoomIn size={12} />
            </button>
          </div>
          <button onClick={fitAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-sans font-semibold bg-foreground text-background hover:opacity-80 transition-opacity"
            style={{ borderRadius: "9px" }}>
            <Maximize2 size={11} /> Fit all
          </button>
          <button onClick={() => setShowMiniMap((s) => !s)}
            className={`w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted ${showMiniMap ? "bg-muted text-foreground" : ""}`}>
            <Map size={13} />
          </button>
          <button onClick={() => setSeedsOpen((s) => !s)}
            className="btn-ghost-pill text-xs flex items-center gap-1.5 px-3 py-2">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Canvas viewport */}
      <div className="flex-1 relative overflow-hidden" ref={canvasRef}>

        {/* Seeds panel */}
        {seedsOpen && (
          <div className="absolute top-4 left-4 z-40 w-48 shadow-float animate-scale-in"
            style={{ background: "hsl(var(--background))", borderRadius: "16px", border: "1px solid rgba(26,26,26,0.10)" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
              <p className="text-xs font-semibold font-sans text-foreground">Available Seeds</p>
              <button onClick={() => setSeedsOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
            </div>
            <div className="p-2">
              {AVAILABLE_SEEDS_LIST.map((seed) => {
                const t = TOOL_CONFIGS[seed.tool];
                if (!t) return null;
                return (
                  <div key={seed.tool}
                    className="flex items-center gap-3 px-3 py-3 text-xs font-sans hover:bg-muted transition-colors cursor-grab"
                    style={{ borderRadius: "10px" }}>
                    <span style={{ color: t.color }} className="font-bold w-5 text-center text-sm">{t.logo}</span>
                    <span className="text-foreground font-medium">{seed.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pannable, zoomable SVG canvas */}
        <div
          className="w-full h-full"
          style={{ cursor: draggingId ? "grabbing" : "grab" }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          <svg width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
            <g transform={`translate(${transform.x + vw / 2 - CORE.x * transform.scale}, ${transform.y + vh / 2 - CORE.y * transform.scale}) scale(${transform.scale})`}>

              {/* Connections */}
              {nodes.map((n) => {
                const from = CORE;
                const to = getNodeCenter(n);
                const tool = TOOL_CONFIGS[n.tool];
                const isBloom = n.state === "bloom";
                const isSprout = n.state === "sprout";
                return (
                  <g key={n.id}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="currentColor" strokeWidth={isBloom ? 1.2 : 0.8}
                      strokeDasharray={isSprout ? "5 7" : "none"}
                      opacity={n.state === "seed" ? 0.12 : isSprout ? 0.35 : 0.6} />
                    {isBloom && (
                      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="currentColor" strokeWidth="0.9" strokeDasharray="5 9" opacity="0.25" className="data-flow" />
                    )}
                    {isBloom && tool && <ParticleTrail x1={from.x} y1={from.y} x2={to.x} y2={to.y} color={tool.color} delay={0} />}
                  </g>
                );
              })}

              {/* ── OmniDesk core (CLICKABLE) ── */}
              <g
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setCoreOverlayOpen(true); setSelectedNode(null); }}
              >
                {/* Outer pulse ring */}
                <circle cx={CORE.x} cy={CORE.y} r="32" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0">
                  <animate attributeName="r" values="28;42;28" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
                </circle>
                {/* Bloom-status ring */}
                {bloomCount > 0 && (
                  <circle cx={CORE.x} cy={CORE.y} r="35" fill="none"
                    stroke="hsl(var(--omni-leaf))" strokeWidth="1" opacity="0.25" className="bloom-pulse" />
                )}
                {/* Main circle */}
                <circle cx={CORE.x} cy={CORE.y} r="28"
                  stroke="currentColor" strokeWidth="0.8" fill="hsl(var(--card))"
                  className="hover:fill-muted transition-all" />
                {/* Power icon hint on hover */}
                <circle cx={CORE.x} cy={CORE.y} r="12" fill="hsl(var(--foreground))" opacity="0.07" />
                {/* Text */}
                <text x={CORE.x} y={CORE.y - 4} textAnchor="middle" fontSize="8"
                  fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">Omni</text>
                <text x={CORE.x} y={CORE.y + 7} textAnchor="middle" fontSize="8"
                  fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">Desk</text>
                {/* Power icon indicator */}
                <text x={CORE.x} y={CORE.y + 20} textAnchor="middle" fontSize="7"
                  fill="currentColor" fontFamily="Inter" opacity="0.3">⏻ tap</text>
              </g>

              {/* Tool nodes */}
              {nodes.map((n) => (
                <FlowNode key={n.id}
                  node={{ ...n, position: localPositions[n.id] ?? getNodePos(n.position.x, n.position.y) }}
                  onSelect={(node) => { setSelectedNode(node); setCoreOverlayOpen(false); }}
                  isSelected={selectedNode?.id === n.id}
                  onDragStart={handleNodeDragStart}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Mini map */}
        {showMiniMap && !selectedNode && (
          <MiniMap nodes={nodes} localPositions={localPositions} transform={transform} viewportW={vw} viewportH={vh} />
        )}

        {/* OmniDesk Core Overlay */}
        {coreOverlayOpen && (
          <CoreOverlay
            bloomedNodes={bloomedNodes}
            onDisconnectAll={handleDisconnectAll}
            onAutoConnect={handleAutoConnect}
            onClose={() => setCoreOverlayOpen(false)}
            loading={coreLoading}
          />
        )}

        {/* Workflow Agent Drawer */}
        <WorkflowDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />

        {/* Bottom hint */}
        {!selectedNode && !coreOverlayOpen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans px-4 py-2 pointer-events-none whitespace-nowrap hidden sm:block"
            style={{
              background: "hsl(var(--background))",
              borderRadius: "50px",
              border: "1px solid rgba(26,26,26,0.08)",
              boxShadow: "var(--shadow-subtle)",
            }}>
            Click nodes to control them · Click OmniDesk core to manage connections
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 md:px-8 py-3 flex items-center gap-4 flex-wrap text-xs font-sans text-muted-foreground"
        style={{ borderTop: "1px solid rgba(26,26,26,0.08)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full opacity-30" style={{ border: "1px solid currentColor" }} />Seed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ border: "1px solid currentColor", background: "hsl(var(--card))" }} />Sprout
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-omni-bloom bloom-pulse" />Bloom (live)
        </span>
        <span className="ml-auto opacity-45">{bloomCount} active · {nodes.length} total</span>
      </div>
    </div>
  );
}
