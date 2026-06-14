import { useState, useRef, useCallback, useEffect } from "react";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { TOOL_CONFIGS } from "@/constants";
import type { WorkflowNode, NodeState } from "@/types";
import { X, ExternalLink, Zap, Activity, Clock, CheckCircle, Loader2, Plus, ZoomIn, ZoomOut, Maximize2, Map } from "lucide-react";

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
      <circle cx={r} cy={r} r={r} fill={isBloom || isSprout ? "hsl(var(--card))" : "hsl(var(--background))"}
        stroke={isSelected ? tool.color : "currentColor"} strokeWidth={isSelected ? "1.5" : "0.8"}
        strokeDasharray={isSeed ? "3 3" : "none"} opacity={isSeed ? 0.35 : 1}
        className={isSeed ? "seed-shimmer" : ""}
      />
      {isSelected && <circle cx={r} cy={r} r={r + 9} fill="none" stroke={tool.color} strokeWidth="0.7" opacity="0.35" strokeDasharray="3 4" />}
      <text x={r} y={r + 6} textAnchor="middle" fontSize={isBloom ? "16" : isSprout ? "14" : "12"}
        fill={isBloom ? tool.color : "currentColor"} fontFamily="Inter" fontWeight={isBloom ? "700" : "400"}
        opacity={isSeed ? 0.4 : 1} className={isAnimating ? "petal-open" : ""} style={{ pointerEvents: "none" }}>
        {tool.logo}
      </text>
      <text x={r} y={r * 2 + 15} textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="Inter"
        opacity={isSeed ? 0.35 : 0.65} style={{ pointerEvents: "none" }}>
        {node.label}
      </text>
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────
   NODE DRAWER — improved with animated state transition steps
───────────────────────────────────────────────────────────── */
const STATE_STEPS = [
  { key: "seed", label: "Seed", desc: "Integration ready to plant", icon: "🌱" },
  { key: "sprout", label: "Sprout", desc: "Authorising & configuring", icon: "🌿" },
  { key: "bloom", label: "Bloom", desc: "Live and flowing data", icon: "🌸" },
];

function StateTimeline({ state }: { state: NodeState }) {
  const currentIdx = STATE_STEPS.findIndex((s) => s.key === state);
  return (
    <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">Connection Journey</p>
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-4 left-4 right-4 h-px bg-muted" style={{ zIndex: 0 }} />
        <div
          className="absolute top-4 left-4 h-px bg-foreground transition-all duration-700 ease-out"
          style={{ width: `${(currentIdx / (STATE_STEPS.length - 1)) * calc100()}%`, zIndex: 0 }}
        />
        <div className="relative flex justify-between">
          {STATE_STEPS.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ zIndex: 1 }}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                    done ? "bg-omni-leaf text-background scale-100" :
                    active ? "bg-foreground text-background scale-110 shadow-md" :
                    "bg-muted text-muted-foreground scale-100"
                  }`}
                  style={active ? { boxShadow: "0 0 0 3px hsl(var(--foreground) / 0.15)" } : {}}
                >
                  {done ? "✓" : step.icon}
                </div>
                <p className={`text-[9px] font-sans text-center leading-tight font-semibold transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`}>
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

// Helper to avoid expression-in-CSS issue
function calc100() { return 100; }

function NodeDrawer({ node, onClose, onConnect, isConnecting }: {
  node: WorkflowNode | null; onClose: () => void;
  onConnect: (id: string, state: NodeState) => void; isConnecting: boolean;
}) {
  if (!node) return null;
  const tool = TOOL_CONFIGS[node.tool];
  const isBloom = node.state === "bloom";
  const isSprout = node.state === "sprout";

  const toolDescriptions: Record<string, string> = {
    paystack: "Accept card, bank transfer, USSD, and mobile money payments. Nigeria's leading payment gateway.",
    flutterwave: "Pan-African payment infrastructure. Accept payments across 35+ African countries and globally.",
    whatsapp: "Automate customer messaging, order confirmations, and broadcasts via WhatsApp.",
    google_workspace: "Automate Gmail, Google Sheets, Drive, and Calendar workflows.",
    shopify: "Sync your e-commerce store, manage products, and automate order fulfillment.",
    slack: "Automate team notifications, alerts, and workflow communication.",
    make: "Build no-code automation scenarios connecting all your tools.",
    mailchimp: "Automate email marketing, segment audiences, and trigger campaigns.",
    notion: "Organize knowledge, tasks, and documentation in one workspace.",
    instagram: "Automate Instagram DMs, post scheduling, and lead capture.",
    stripe: "Global online payments for international markets.",
    quickbooks: "Automate invoicing, expenses, and financial reporting.",
  };

  return (
    <div
      className="absolute top-0 right-0 h-full w-[300px] flex flex-col overflow-y-auto animate-slide-right glass-panel"
      style={{ zIndex: 30, borderRadius: 0, borderTop: "none", borderBottom: "none", borderRight: "none" }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${tool.color}18`, color: tool.color }}>
          {tool.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold font-sans text-foreground">{tool.name}</h3>
          <p className="text-xs text-muted-foreground font-sans capitalize">{node.state} · {node.category}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted flex-shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* Animated state timeline */}
      <StateTimeline state={node.state} />

      {/* Status badge */}
      <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div className={`flex items-center gap-2.5 px-4 py-3 text-xs font-sans ${
          isBloom ? "text-omni-leaf" : isSprout ? "text-omni-gold" : "text-muted-foreground"
        }`} style={{ borderRadius: "12px", background: isBloom ? "rgba(74,163,100,0.08)" : isSprout ? "rgba(217,160,60,0.08)" : "hsl(var(--muted))" }}>
          {isBloom ? <CheckCircle size={12} /> : isSprout ? <Activity size={12} /> : <Clock size={12} />}
          <span className="font-semibold capitalize">{node.state}</span>
          <span className="opacity-55 ml-1">{isBloom ? "· Live & flowing" : isSprout ? "· Configuring" : "· Ready to plant"}</span>
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

      {/* Active workflows */}
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

      {/* About */}
      <div className="px-5 py-4 flex-1">
        <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest mb-3 font-semibold">About</p>
        <p className="text-sm text-muted-foreground font-sans leading-relaxed">
          {toolDescriptions[node.tool] ?? `Connect ${tool.name} to automate your workflows.`}
        </p>
      </div>

      {/* Next step hint */}
      {!isBloom && (
        <div className="px-5 py-3 mx-5 mb-2 rounded-xl text-xs font-sans text-muted-foreground leading-relaxed" style={{ background: "hsl(var(--muted))" }}>
          {isSprout ? (
            <><strong className="text-foreground">Next:</strong> Click "Complete setup" to authorise the OAuth connection and go live.</>
          ) : (
            <><strong className="text-foreground">Next:</strong> Click "Plant seed" to start the connection journey from Seed → Sprout → Bloom.</>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="px-5 py-4 space-y-2.5" style={{ borderTop: "1px solid rgba(26,26,26,0.06)" }}>
        {isBloom ? (
          <>
            <button onClick={() => onConnect(node.id, "sprout")} className="btn-ghost w-full text-xs py-3 justify-center">Disconnect</button>
            <a href="#" className="btn-primary w-full text-xs justify-center flex items-center gap-1.5 py-3">
              <ExternalLink size={12} /> Open {tool.name}
            </a>
          </>
        ) : isSprout ? (
          <button onClick={() => onConnect(node.id, "bloom")} disabled={isConnecting}
            className="btn-primary w-full text-xs justify-center flex items-center gap-2 py-3">
            {isConnecting ? <><Loader2 size={13} className="animate-spin" />Authorising…</> : `Complete ${tool.name} setup →`}
          </button>
        ) : (
          <button onClick={() => onConnect(node.id, "sprout")} disabled={isConnecting}
            className="btn-primary w-full text-xs justify-center flex items-center gap-2 py-3.5">
            {isConnecting ? <><Loader2 size={13} className="animate-spin" />Starting…</> : `🌱 Plant ${tool.name} seed`}
          </button>
        )}
      </div>
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

interface MiniMapProps {
  nodes: WorkflowNode[];
  localPositions: Record<string, { x: number; y: number }>;
  transform: { x: number; y: number; scale: number };
  viewportW: number;
  viewportH: number;
}

function MiniMap({ nodes, localPositions, transform, viewportW, viewportH }: MiniMapProps) {
  const scaleX = MINI_W / CANVAS_SIZE;
  const scaleY = MINI_H / CANVAS_SIZE;

  // Viewport rect in minimap coords
  const vpW = Math.min(MINI_W, (viewportW / transform.scale) * scaleX);
  const vpH = Math.min(MINI_H, (viewportH / transform.scale) * scaleY);
  const vpX = Math.max(0, (-transform.x / transform.scale + CORE.x - viewportW / 2 / transform.scale) * scaleX);
  const vpY = Math.max(0, (-transform.y / transform.scale + CORE.y - viewportH / 2 / transform.scale) * scaleY);

  return (
    <div
      className="absolute bottom-16 right-4 z-40 animate-scale-in"
      style={{
        background: "hsl(var(--background))",
        border: "1px solid rgba(26,26,26,0.12)",
        borderRadius: "12px",
        padding: "6px",
        boxShadow: "var(--shadow-float)",
      }}
    >
      <p className="text-[9px] font-sans text-muted-foreground uppercase tracking-widest mb-1.5 px-1">Mini Map</p>
      <svg width={MINI_W} height={MINI_H} style={{ display: "block", overflow: "hidden", borderRadius: "8px", background: "hsl(var(--card))" }}>
        {/* Connections */}
        {nodes.map((n) => {
          const to = localPositions[n.id] ?? getNodePos(n.position.x, n.position.y);
          return (
            <line key={n.id}
              x1={CORE.x * scaleX} y1={CORE.y * scaleY}
              x2={to.x * scaleX} y2={to.y * scaleY}
              stroke="currentColor" strokeWidth="0.5" opacity="0.2"
            />
          );
        })}
        {/* Core node */}
        <circle cx={CORE.x * scaleX} cy={CORE.y * scaleY} r="5" fill="hsl(var(--foreground))" opacity="0.7" />
        {/* Tool nodes */}
        {nodes.map((n) => {
          const tool = TOOL_CONFIGS[n.tool];
          const pos = localPositions[n.id] ?? getNodePos(n.position.x, n.position.y);
          return (
            <circle key={n.id}
              cx={pos.x * scaleX} cy={pos.y * scaleY} r="4"
              fill={n.state === "bloom" ? tool.color : n.state === "sprout" ? tool.color : "currentColor"}
              opacity={n.state === "bloom" ? 0.85 : n.state === "sprout" ? 0.55 : 0.25}
            />
          );
        })}
        {/* Viewport rect */}
        <rect x={vpX} y={vpY} width={vpW} height={vpH}
          fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.35"
          strokeDasharray="3 2"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLOWERBED PAGE
───────────────────────────────────────────────────────────── */
const AVAILABLE_SEEDS_LIST = [
  { tool: "flutterwave" as const, label: "Flutterwave" },
  { tool: "slack" as const, label: "Slack" },
  { tool: "google_workspace" as const, label: "Google Workspace" },
  { tool: "mailchimp" as const, label: "Mailchimp" },
  { tool: "instagram" as const, label: "Instagram" },
  { tool: "shopify" as const, label: "Shopify" },
];

export default function FlowerbedPage() {
  const { nodes, loading, updateNodeState } = useWorkflowNodes();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [seedsOpen, setSeedsOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);

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

  // Fit all — auto-zoom to show all nodes
  const fitAll = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) {
      setTransform({ x: 0, y: 0, scale: 0.7 });
      return;
    }
    const vw = canvasRef.current.clientWidth;
    const vh = canvasRef.current.clientHeight;

    const allX = nodes.map((n) => (localPositions[n.id] ?? getNodePos(n.position.x, n.position.y)).x).concat([CORE.x]);
    const allY = nodes.map((n) => (localPositions[n.id] ?? getNodePos(n.position.x, n.position.y)).y).concat([CORE.y]);
    const minX = Math.min(...allX) - 60;
    const maxX = Math.max(...allX) + 60;
    const minY = Math.min(...allY) - 60;
    const maxY = Math.max(...allY) + 60;

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const newScale = Math.min(2, Math.max(0.25, Math.min(vw / contentW, vh / contentH) * 0.85));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newTx = vw / 2 - centerX * newScale;
    const newTy = vh / 2 - centerY * newScale;

    setTransform({ x: newTx, y: newTy, scale: newScale });
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

  const bloomCount = nodes.filter((n) => n.state === "bloom").length;
  const sproutCount = nodes.filter((n) => n.state === "sprout").length;
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
          <p className="text-[11px] text-muted-foreground font-sans mt-0.5 hidden sm:block">Scroll to zoom · Drag canvas to pan · Drag nodes to reposition</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="hidden sm:flex items-center gap-3 text-xs font-sans text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-omni-leaf" />{bloomCount} live</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-omni-gold" />{sproutCount} sprouting</span>
          </div>
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 surface-flat p-1">
            <button onClick={() => zoom(-0.15)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"><ZoomOut size={12} /></button>
            <span className="text-[11px] font-sans text-muted-foreground px-1.5 min-w-[36px] text-center">{Math.round(transform.scale * 100)}%</span>
            <button onClick={() => zoom(0.15)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"><ZoomIn size={12} /></button>
          </div>
          {/* Fit all button */}
          <button onClick={fitAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-sans font-semibold bg-foreground text-background hover:opacity-80 transition-opacity"
            style={{ borderRadius: "9px" }}>
            <Maximize2 size={11} /> Fit all
          </button>
          {/* Mini map toggle */}
          <button onClick={() => setShowMiniMap((s) => !s)}
            className={`w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted ${showMiniMap ? "bg-muted text-foreground" : ""}`}
            title="Toggle mini map">
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
                  <div key={seed.tool} className="flex items-center gap-3 px-3 py-3 text-xs font-sans hover:bg-muted transition-colors cursor-grab" style={{ borderRadius: "10px" }}>
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
              {nodes.map((n) => {
                const from = CORE;
                const to = getNodeCenter(n);
                const tool = TOOL_CONFIGS[n.tool];
                const isBloom = n.state === "bloom";
                const isSprout = n.state === "sprout";
                return (
                  <g key={n.id}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor"
                      strokeWidth={isBloom ? 1.2 : 0.8} strokeDasharray={isSprout ? "5 7" : "none"}
                      opacity={n.state === "seed" ? 0.12 : isSprout ? 0.35 : 0.6} />
                    {isBloom && (
                      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor"
                        strokeWidth="0.9" strokeDasharray="5 9" opacity="0.25" className="data-flow" />
                    )}
                    {isBloom && <ParticleTrail x1={from.x} y1={from.y} x2={to.x} y2={to.y} color={tool.color} delay={0} />}
                  </g>
                );
              })}

              {/* OmniDesk core */}
              <g>
                <circle cx={CORE.x} cy={CORE.y} r="28" stroke="currentColor" strokeWidth="0.8" fill="hsl(var(--card))" />
                <circle cx={CORE.x} cy={CORE.y} r="29" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0">
                  <animate attributeName="r" values="26;38;26" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0;0.25" dur="4s" repeatCount="indefinite" />
                </circle>
                <text x={CORE.x} y={CORE.y - 4} textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">Omni</text>
                <text x={CORE.x} y={CORE.y + 7} textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">Desk</text>
              </g>

              {nodes.map((n) => (
                <FlowNode key={n.id}
                  node={{ ...n, position: localPositions[n.id] ?? getNodePos(n.position.x, n.position.y) }}
                  onSelect={setSelectedNode}
                  isSelected={selectedNode?.id === n.id}
                  onDragStart={handleNodeDragStart}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Mini map */}
        {showMiniMap && (
          <MiniMap nodes={nodes} localPositions={localPositions} transform={transform} viewportW={vw} viewportH={vh} />
        )}

        {/* Node drawer */}
        <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} onConnect={handleConnect} isConnecting={isConnecting} />

        {/* Bottom hint */}
        {!selectedNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans px-4 py-2 pointer-events-none whitespace-nowrap hidden sm:block"
            style={{ background: "hsl(var(--background))", borderRadius: "50px", border: "1px solid rgba(26,26,26,0.08)", boxShadow: "var(--shadow-subtle)" }}>
            Scroll to zoom · Drag to pan · Drag nodes to reposition
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 md:px-8 py-3 flex items-center gap-4 flex-wrap text-xs font-sans text-muted-foreground"
        style={{ borderTop: "1px solid rgba(26,26,26,0.08)" }}>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full opacity-30" style={{ border: "1px solid currentColor" }} />Seed</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ border: "1px solid currentColor", background: "hsl(var(--card))" }} />Sprout</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-omni-bloom bloom-pulse" />Bloom (live)</span>
        <span className="ml-auto opacity-45">{bloomCount} active · {nodes.length} total</span>
      </div>
    </div>
  );
}
