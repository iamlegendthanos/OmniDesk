import { useState } from "react";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { TOOL_CONFIGS } from "@/constants";
import type { WorkflowNode, NodeState } from "@/types";
import { X, ExternalLink, Zap, Activity, Clock, CheckCircle, Loader2, Plus } from "lucide-react";

/* ── Bloom Node ── */
function FlowNode({ node, onSelect, isSelected }: {
  node: WorkflowNode;
  onSelect: (n: WorkflowNode) => void;
  isSelected: boolean;
}) {
  const tool = TOOL_CONFIGS[node.tool];
  const isSeed = node.state === "seed";
  const isSprout = node.state === "sprout";
  const isBloom = node.state === "bloom";
  const isAnimating = node.animating;
  const r = isSeed ? 15 : 20;

  return (
    <g
      transform={`translate(${node.position.x - r - 2}, ${node.position.y - r - 2})`}
      className="cursor-pointer"
      onClick={() => onSelect(node)}
      style={{ userSelect: "none" }}
    >
      {/* Bloom burst ring */}
      {isAnimating && (
        <circle cx={r + 2} cy={r + 2} r="4" fill="none" stroke={tool.color} strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="4;36" dur="1s" fill="freeze" />
          <animate attributeName="opacity" values="0.7;0" dur="1s" fill="freeze" />
        </circle>
      )}

      {/* Bloom petals */}
      {isBloom && [0, 51, 102, 153, 204, 255, 306].map((deg, i) => {
        const px = r + 2 + Math.cos((deg * Math.PI) / 180) * 20;
        const py = r + 2 + Math.sin((deg * Math.PI) / 180) * 20;
        return (
          <ellipse
            key={i}
            cx={px} cy={py} rx="8" ry="3.5"
            fill={tool.color}
            opacity={isAnimating ? 0 : 0.2}
            transform={`rotate(${deg},${px},${py})`}
            className={isAnimating ? "petal-open" : "bloom-pulse"}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        );
      })}

      {/* Sprout leaves */}
      {isSprout && (
        <g>
          <ellipse cx={r + 2 + 14} cy={r + 2 - 13} rx="6" ry="2.8" fill="#5C7A5A" opacity="0.75"
            transform={`rotate(-30,${r + 16},${r - 11})`} className="sprout-pulse" />
          <line x1={r + 2} y1={r + 2 - r + 4} x2={r + 2 + 10} y2={r + 2 - 15}
            stroke="#5C7A5A" strokeWidth="0.8" opacity="0.65" />
        </g>
      )}

      {/* Main circle */}
      <circle
        cx={r + 2} cy={r + 2} r={r}
        fill={isBloom || isSprout ? "hsl(var(--card))" : "hsl(var(--background))"}
        stroke={isSelected ? tool.color : "currentColor"}
        strokeWidth={isSelected ? "1.5" : "0.8"}
        strokeDasharray={isSeed ? "3 3" : "none"}
        opacity={isSeed ? 0.3 : 1}
        className={isSeed ? "seed-shimmer" : ""}
      />

      {/* Selection ring */}
      {isSelected && (
        <circle cx={r + 2} cy={r + 2} r={r + 8} fill="none"
          stroke={tool.color} strokeWidth="0.7" opacity="0.35"
          strokeDasharray="3 4"
        />
      )}

      {/* Tool logo */}
      <text
        x={r + 2} y={r + 7} textAnchor="middle"
        fontSize={isBloom ? "14" : isSprout ? "12" : "10"}
        fill={isBloom ? tool.color : "currentColor"}
        fontFamily="Inter" fontWeight={isBloom ? "700" : "400"}
        opacity={isSeed ? 0.4 : 1}
        className={isAnimating ? "petal-open" : ""}
      >
        {tool.logo}
      </text>

      {/* Label */}
      <text
        x={r + 2} y={r * 2 + 13} textAnchor="middle"
        fontSize="7" fill="currentColor" fontFamily="Inter"
        opacity={isSeed ? 0.35 : 0.6}
      >
        {node.label}
      </text>

      {/* Bloom glow bg */}
      {isBloom && (
        <circle cx={r + 2} cy={r + 2} r={r + 3} fill={tool.color} opacity="0.06" className="bloom-pulse" />
      )}
    </g>
  );
}

/* ── Connector line ── */
function Connector({ from, to, state }: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  state: NodeState;
}) {
  const isBloom = state === "bloom";
  const isSprout = state === "sprout";
  return (
    <g>
      <line
        x1={`${from.x}%`} y1={`${from.y}%`}
        x2={`${to.x}%`} y2={`${to.y}%`}
        stroke="currentColor" strokeWidth="0.8"
        strokeDasharray={isSprout ? "3 5" : "none"}
        opacity={state === "seed" ? 0.1 : isSprout ? 0.4 : 0.7}
      />
      {isBloom && (
        <line
          x1={`${from.x}%`} y1={`${from.y}%`}
          x2={`${to.x}%`} y2={`${to.y}%`}
          stroke="currentColor" strokeWidth="0.8"
          strokeDasharray="4 8" opacity="0.3"
          className="data-flow"
        />
      )}
    </g>
  );
}

/* ── Node Drawer ── */
function NodeDrawer({ node, onClose, onConnect, isConnecting }: {
  node: WorkflowNode | null;
  onClose: () => void;
  onConnect: (id: string, state: NodeState) => void;
  isConnecting: boolean;
}) {
  if (!node) return null;
  const tool = TOOL_CONFIGS[node.tool];
  const isBloom = node.state === "bloom";
  const isSprout = node.state === "sprout";

  return (
    <div
      className="absolute top-0 right-0 h-full w-72 flex flex-col overflow-y-auto animate-slide-right glass-panel"
      style={{ borderRadius: "0 0 0 0", zIndex: 20, borderTop: "none", borderBottom: "none", borderRight: "none" }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: `${tool.color}18`, color: tool.color }}
        >
          {tool.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold font-sans text-foreground">{tool.name}</h3>
          <p className="text-xs text-muted-foreground font-sans capitalize">{node.state} · {node.category}</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
        >
          <X size={14} />
        </button>
      </div>

      {/* Status */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div
          className={`flex items-center gap-2.5 px-4 py-3 text-xs font-sans ${
            isBloom ? "text-omni-leaf" : isSprout ? "text-omni-gold" : "text-muted-foreground"
          }`}
          style={{ borderRadius: "12px", background: isBloom ? "rgba(74,163,100,0.08)" : isSprout ? "rgba(217,160,60,0.08)" : "hsl(var(--muted))" }}
        >
          {isBloom ? <CheckCircle size={12} /> : isSprout ? <Activity size={12} /> : <Clock size={12} />}
          <span className="font-semibold capitalize">{node.state}</span>
          <span className="opacity-55 ml-1">
            {isBloom ? "· Live & flowing" : isSprout ? "· Configuring" : "· Ready to plant"}
          </span>
        </div>
      </div>

      {/* Stats (bloom only) */}
      {isBloom && (
        <div className="px-5 py-4 grid grid-cols-2 gap-2.5" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="font-serif text-2xl text-foreground">{node.uptime}%</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Uptime</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="font-serif text-2xl text-foreground">{node.workflows?.length || 0}</p>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Workflows</p>
          </div>
          <div className="col-span-2 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-xs text-muted-foreground font-sans mb-1">Last sync</p>
            <p className="text-sm font-semibold font-sans text-foreground">{node.lastSync}</p>
          </div>
        </div>
      )}

      {/* Workflows */}
      {isBloom && node.workflows && node.workflows.length > 0 && (
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
          <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">Active Workflows</p>
          <div className="space-y-2.5">
            {node.workflows.map((wf, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs font-sans text-foreground">
                <Zap size={10} className="text-omni-leaf flex-shrink-0" />{wf}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="px-5 py-4 flex-1">
        <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">About</p>
        <p className="text-sm text-muted-foreground font-sans leading-relaxed">
          {node.tool === "stripe" && "Accept payments, manage subscriptions, and automate billing workflows."}
          {node.tool === "shopify" && "Sync your e-commerce store, manage products, and automate order fulfillment."}
          {node.tool === "make" && "Build no-code automation scenarios connecting all your tools seamlessly."}
          {node.tool === "mailchimp" && "Automate email marketing, segment audiences, and trigger campaigns."}
          {node.tool === "quickbooks" && "Track invoices, expenses, and financial reports automatically."}
          {node.tool === "notion" && "Organize knowledge, tasks, and documentation in one connected workspace."}
          {node.tool === "slack" && "Automate team notifications, alerts, and workflow communication."}
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 py-4 space-y-2.5" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
        {isBloom ? (
          <>
            <button onClick={() => onConnect(node.id, "sprout")} className="btn-ghost w-full text-xs py-3 justify-center">
              Disconnect
            </button>
            <a href="#" className="btn-primary w-full text-xs justify-center flex items-center gap-1.5 py-3">
              <ExternalLink size={12} /> Open {tool.name}
            </a>
          </>
        ) : isSprout ? (
          <button
            onClick={() => onConnect(node.id, "bloom")}
            disabled={isConnecting}
            className="btn-primary w-full text-xs justify-center flex items-center gap-2 py-3"
          >
            {isConnecting
              ? <><Loader2 size={13} className="animate-spin" />Authorising…</>
              : `Complete ${tool.name} setup`
            }
          </button>
        ) : (
          <button
            onClick={() => onConnect(node.id, "sprout")}
            disabled={isConnecting}
            className="btn-primary w-full text-xs justify-center flex items-center gap-2 py-3.5"
          >
            {isConnecting
              ? <><Loader2 size={13} className="animate-spin" />Starting…</>
              : `🌱 Plant ${tool.name} seed`
            }
          </button>
        )}
      </div>
    </div>
  );
}

const CORE = { x: 50, y: 50 };
const AVAILABLE_SEEDS = [
  { tool: "notion" as const, label: "Notion" },
  { tool: "slack" as const, label: "Slack" },
  { tool: "quickbooks" as const, label: "QuickBooks" },
];

export default function FlowerbedPage() {
  const { nodes, loading, updateNodeState } = useWorkflowNodes();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [seedsOpen, setSeedsOpen] = useState(false);

  const handleConnect = async (id: string, newState: NodeState) => {
    setIsConnecting(true);
    await new Promise((r) => setTimeout(r, 1500));
    updateNodeState(id, newState);
    setIsConnecting(false);
    const found = nodes.find((n) => n.id === id);
    if (found) setSelectedNode({ ...found, state: newState });
  };

  const bloomCount = nodes.filter((n) => n.state === "bloom").length;
  const sproutCount = nodes.filter((n) => n.state === "sprout").length;

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div
        className="px-6 md:px-8 py-5 flex items-center gap-4 flex-shrink-0 flex-wrap gap-y-3"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}
      >
        <div>
          <h1 className="font-serif text-2xl text-foreground">Workflow Flowerbed</h1>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Your living business automation garden</p>
        </div>
        <div className="ml-auto flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-5 text-xs font-sans text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-omni-leaf" />{bloomCount} blooming
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-omni-gold" />{sproutCount} sprouting
            </span>
          </div>
          <button
            onClick={() => setSeedsOpen((s) => !s)}
            className="btn-ghost-pill text-xs flex items-center gap-1.5 px-4 py-2.5"
          >
            <Plus size={13} /> Add seed
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: "500px" }}>
        {/* Seeds panel */}
        {seedsOpen && (
          <div
            className="absolute top-5 left-5 z-20 w-48 shadow-float animate-scale-in"
            style={{ background: "hsl(var(--background))", borderRadius: "16px", border: "1px solid rgba(26,26,26,0.10)" }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
              <p className="text-xs font-semibold font-sans text-foreground">Available Seeds</p>
              <button onClick={() => setSeedsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={12} />
              </button>
            </div>
            <div className="p-2">
              {AVAILABLE_SEEDS.map((seed) => {
                const t = TOOL_CONFIGS[seed.tool];
                return (
                  <div
                    key={seed.tool}
                    className="flex items-center gap-3 px-3 py-3 text-xs font-sans hover:bg-muted transition-colors cursor-grab"
                    style={{ borderRadius: "10px" }}
                  >
                    <span style={{ color: t.color }} className="font-bold w-5 text-center text-sm">{t.logo}</span>
                    <span className="text-foreground font-medium">{seed.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full absolute inset-0"
          style={{ minHeight: "500px" }}
        >
          {/* Connector lines */}
          {nodes.map((n) => (
            <Connector key={n.id} from={CORE} to={n.position} state={n.state} />
          ))}

          {/* OmniDesk core node */}
          <g transform={`translate(${CORE.x - 16}, ${CORE.y - 16})`}>
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="0.8" fill="hsl(var(--card))" />
            {/* Pulse ring */}
            <circle cx="16" cy="16" r="16" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0">
              <animate attributeName="r" values="14;22;14" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <text x="16" y="13" textAnchor="middle" fontSize="4.5" fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">Omni</text>
            <text x="16" y="19.5" textAnchor="middle" fontSize="4.5" fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">Desk</text>
          </g>

          {/* Tool nodes */}
          {nodes.map((n) => (
            <FlowNode
              key={n.id}
              node={n}
              onSelect={setSelectedNode}
              isSelected={selectedNode?.id === n.id}
            />
          ))}
        </svg>

        {/* Node drawer */}
        <NodeDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />

        {/* Hint */}
        {!selectedNode && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans px-5 py-2.5 pointer-events-none"
            style={{ background: "hsl(var(--background))", borderRadius: "50px", border: "1px solid rgba(26,26,26,0.08)", boxShadow: "var(--shadow-subtle)" }}
          >
            Click any node to inspect · Connect to bloom
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="px-6 md:px-8 py-3.5 flex items-center gap-6 flex-wrap text-xs font-sans text-muted-foreground"
        style={{ borderTop: "1px solid rgba(26,26,26,0.08)" }}
      >
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full opacity-30" style={{ border: "1px solid currentColor" }} />Seed
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ border: "1px solid currentColor", background: "hsl(var(--card))" }} />Sprout
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-omni-bloom bloom-pulse" />Bloom (live)
        </span>
        <span className="ml-auto opacity-45">{bloomCount} active · {nodes.length} total</span>
      </div>
    </div>
  );
}
