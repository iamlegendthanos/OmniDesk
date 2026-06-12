import { useState, useRef, useCallback, useEffect } from "react";
import { useWorkflowNodes } from "@/hooks/useWorkflowNodes";
import { TOOL_CONFIGS } from "@/constants";
import type { WorkflowNode, NodeState } from "@/types";
import { X, ExternalLink, Zap, Activity, Clock, CheckCircle, Loader2, Plus, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   PARTICLE TRAIL — animated dots flowing along SVG path
───────────────────────────────────────────────────────────── */
interface ParticleProps {
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
  delay: number;
}

function ParticleTrail({ x1, y1, x2, y2, color, delay }: ParticleProps) {
  const id = `pt-${x1}-${y1}-${x2}-${y2}-${delay}`;
  return (
    <g>
      <defs>
        <path id={id} d={`M ${x1} ${y1} L ${x2} ${y2}`} />
      </defs>
      {[0, 0.33, 0.66].map((offset, i) => (
        <circle key={i} r="2.5" fill={color} opacity="0.7">
          <animateMotion
            dur="2s"
            begin={`${delay + offset * 2}s`}
            repeatCount="indefinite"
            path={`M ${x1} ${y1} L ${x2} ${y2}`}
          />
          <animate attributeName="opacity" values="0;0.8;0" dur="2s"
            begin={`${delay + offset * 2}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="1.5;2.5;1.5" dur="2s"
            begin={`${delay + offset * 2}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────
   BLOOM NODE
───────────────────────────────────────────────────────────── */
function FlowNode({ node, onSelect, isSelected, onDragStart }: {
  node: WorkflowNode;
  onSelect: (n: WorkflowNode) => void;
  isSelected: boolean;
  onDragStart: (e: React.PointerEvent, nodeId: string) => void;
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
      {/* Bloom burst ring animation */}
      {isAnimating && (
        <circle cx={r} cy={r} r="4" fill="none" stroke={tool.color} strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="4;44" dur="1.1s" fill="freeze" />
          <animate attributeName="opacity" values="0.7;0" dur="1.1s" fill="freeze" />
        </circle>
      )}

      {/* Petal ring (bloom state) */}
      {isBloom && [0, 51, 102, 153, 204, 255, 306].map((deg, i) => {
        const px = r + Math.cos((deg * Math.PI) / 180) * 26;
        const py = r + Math.sin((deg * Math.PI) / 180) * 26;
        return (
          <ellipse
            key={i} cx={px} cy={py} rx="9" ry="3.8"
            fill={tool.color} opacity={isAnimating ? 0 : 0.18}
            transform={`rotate(${deg},${px},${py})`}
            className={isAnimating ? "petal-open" : "bloom-pulse"}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        );
      })}

      {/* Glow */}
      {isBloom && (
        <circle cx={r} cy={r} r={r + 4} fill={tool.color} opacity="0.07" className="bloom-pulse" />
      )}

      {/* Sprout leaves */}
      {isSprout && (
        <g>
          <ellipse cx={r + 16} cy={r - 15} rx="6.5" ry="2.8"
            fill="#5C7A5A" opacity="0.75"
            transform={`rotate(-30,${r + 16},${r - 15})`}
            className="sprout-pulse"
          />
          <line x1={r} y1={r - r + 5} x2={r + 12} y2={r - 17}
            stroke="#5C7A5A" strokeWidth="0.9" opacity="0.6"
          />
        </g>
      )}

      {/* Main circle */}
      <circle
        cx={r} cy={r} r={r}
        fill={isBloom || isSprout ? "hsl(var(--card))" : "hsl(var(--background))"}
        stroke={isSelected ? tool.color : "currentColor"}
        strokeWidth={isSelected ? "1.5" : "0.8"}
        strokeDasharray={isSeed ? "3 3" : "none"}
        opacity={isSeed ? 0.35 : 1}
        className={isSeed ? "seed-shimmer" : ""}
      />

      {/* Selection ring */}
      {isSelected && (
        <circle cx={r} cy={r} r={r + 9} fill="none"
          stroke={tool.color} strokeWidth="0.7" opacity="0.35"
          strokeDasharray="3 4"
        />
      )}

      {/* Logo */}
      <text
        x={r} y={r + 6} textAnchor="middle"
        fontSize={isBloom ? "16" : isSprout ? "14" : "12"}
        fill={isBloom ? tool.color : "currentColor"}
        fontFamily="Inter" fontWeight={isBloom ? "700" : "400"}
        opacity={isSeed ? 0.4 : 1}
        className={isAnimating ? "petal-open" : ""}
        style={{ pointerEvents: "none" }}
      >
        {tool.logo}
      </text>

      {/* Label */}
      <text
        x={r} y={r * 2 + 15} textAnchor="middle"
        fontSize="8" fill="currentColor" fontFamily="Inter"
        opacity={isSeed ? 0.35 : 0.65}
        style={{ pointerEvents: "none" }}
      >
        {node.label}
      </text>
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────
   NODE DRAWER
───────────────────────────────────────────────────────────── */
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
      style={{ zIndex: 30, borderRadius: 0, borderTop: "none", borderBottom: "none", borderRight: "none" }}
    >
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
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

      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(26,26,26,0.06)" }}>
        <div className={`flex items-center gap-2.5 px-4 py-3 text-xs font-sans ${
          isBloom ? "text-omni-leaf" : isSprout ? "text-omni-gold" : "text-muted-foreground"
        }`} style={{ borderRadius: "12px", background: isBloom ? "rgba(74,163,100,0.08)" : isSprout ? "rgba(217,160,60,0.08)" : "hsl(var(--muted))" }}>
          {isBloom ? <CheckCircle size={12} /> : isSprout ? <Activity size={12} /> : <Clock size={12} />}
          <span className="font-semibold capitalize">{node.state}</span>
          <span className="opacity-55 ml-1">{isBloom ? "· Live & flowing" : isSprout ? "· Configuring" : "· Ready to plant"}</span>
        </div>
      </div>

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
            {isConnecting ? <><Loader2 size={13} className="animate-spin" />Authorising…</> : `Complete ${tool.name} setup`}
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
   CANVAS VIEWPORT — pan, zoom, drag
───────────────────────────────────────────────────────────── */
const CANVAS_SIZE = 1200; // logical px
const CORE = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
// Spread nodes around the center in logical canvas coords
const NODE_SPREAD = 320;

function getNodePos(posX: number, posY: number) {
  // posX/posY are stored as percentages (0-100) relative to canvas center
  return {
    x: CORE.x + (posX - 50) * (NODE_SPREAD / 50),
    y: CORE.y + (posY - 50) * (NODE_SPREAD / 50),
  };
}

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

  // Canvas transform state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.7 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag node state
  const draggingNodeId = useRef<string | null>(null);
  const dragStartPos = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Reset localPositions when nodes load
  useEffect(() => {
    if (nodes.length > 0) {
      const pos: Record<string, { x: number; y: number }> = {};
      nodes.forEach((n) => { pos[n.id] = getNodePos(n.position.x, n.position.y); });
      setLocalPositions(pos);
    }
  }, [nodes.length]);

  const getNodeCenter = (node: WorkflowNode) =>
    localPositions[node.id] ?? getNodePos(node.position.x, node.position.y);

  // ── Zoom ──
  const zoom = useCallback((delta: number) => {
    setTransform((t) => {
      const next = Math.min(2.5, Math.max(0.3, t.scale + delta));
      return { ...t, scale: next };
    });
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 0.7 });
  }, []);

  // ── Wheel zoom ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    zoom(delta);
  }, [zoom]);

  // ── Canvas pan ──
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (draggingNodeId.current) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [transform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingNodeId.current) {
      // Drag node
      const dx = (e.clientX - dragStartPos.current.mx) / transform.scale;
      const dy = (e.clientY - dragStartPos.current.my) / transform.scale;
      const newX = dragStartPos.current.nx + dx;
      const newY = dragStartPos.current.ny + dy;
      setLocalPositions((prev) => ({
        ...prev,
        [draggingNodeId.current!]: { x: newX, y: newY },
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

  // ── Node drag start ──
  const handleNodeDragStart = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.preventDefault();
    draggingNodeId.current = nodeId;
    setDraggingId(nodeId);
    const cur = localPositions[nodeId];
    dragStartPos.current = {
      mx: e.clientX,
      my: e.clientY,
      nx: cur?.x ?? CORE.x,
      ny: cur?.y ?? CORE.y,
    };
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
      <div className="px-6 md:px-8 py-4 flex items-center gap-4 flex-shrink-0 flex-wrap gap-y-3"
        style={{ borderBottom: "1px solid rgba(26,26,26,0.08)" }}>
        <div>
          <h1 className="font-serif text-2xl text-foreground">Workflow Flowerbed</h1>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Pan · Scroll to zoom · Drag nodes to reposition</p>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-xs font-sans text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-omni-leaf" />{bloomCount} blooming
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-omni-gold" />{sproutCount} sprouting
            </span>
          </div>
          {/* Zoom controls */}
          <div className="flex items-center gap-1 surface-flat p-1">
            <button onClick={() => zoom(-0.15)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              <ZoomOut size={13} />
            </button>
            <span className="text-xs font-sans text-muted-foreground px-2 min-w-[40px] text-center">{Math.round(transform.scale * 100)}%</span>
            <button onClick={() => zoom(0.15)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
              <ZoomIn size={13} />
            </button>
            <button onClick={resetView} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted ml-0.5">
              <Maximize2 size={12} />
            </button>
          </div>
          <button onClick={() => setSeedsOpen((s) => !s)}
            className="btn-ghost-pill text-xs flex items-center gap-1.5 px-4 py-2">
            <Plus size={13} /> Add seed
          </button>
        </div>
      </div>

      {/* Canvas viewport */}
      <div className="flex-1 relative overflow-hidden" ref={canvasRef}>
        {/* Seeds panel */}
        {seedsOpen && (
          <div className="absolute top-5 left-5 z-40 w-48 shadow-float animate-scale-in"
            style={{ background: "hsl(var(--background))", borderRadius: "16px", border: "1px solid rgba(26,26,26,0.10)" }}>
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
          style={{ cursor: draggingId ? "grabbing" : isPanning.current ? "grabbing" : "grab" }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          <svg
            width="100%"
            height="100%"
            style={{ display: "block", overflow: "visible" }}
          >
            <g transform={`translate(${transform.x + (canvasRef.current?.clientWidth ?? 800) / 2 - CORE.x * transform.scale}, ${transform.y + (canvasRef.current?.clientHeight ?? 600) / 2 - CORE.y * transform.scale}) scale(${transform.scale})`}>

              {/* Connector lines + particles */}
              {nodes.map((n) => {
                const from = CORE;
                const to = getNodeCenter(n);
                const tool = TOOL_CONFIGS[n.tool];
                const isBloom = n.state === "bloom";
                const isSprout = n.state === "sprout";
                return (
                  <g key={n.id}>
                    {/* Base line */}
                    <line
                      x1={from.x} y1={from.y}
                      x2={to.x} y2={to.y}
                      stroke="currentColor"
                      strokeWidth={isBloom ? 1.2 : 0.8}
                      strokeDasharray={isSprout ? "5 7" : "none"}
                      opacity={n.state === "seed" ? 0.12 : isSprout ? 0.35 : 0.6}
                    />
                    {/* Flowing dash (bloom) */}
                    {isBloom && (
                      <line
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        stroke="currentColor"
                        strokeWidth="0.9"
                        strokeDasharray="5 9"
                        opacity="0.25"
                        className="data-flow"
                      />
                    )}
                    {/* Particle trails (bloom only) */}
                    {isBloom && (
                      <ParticleTrail
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        color={tool.color}
                        delay={0}
                      />
                    )}
                  </g>
                );
              })}

              {/* OmniDesk core node */}
              <g>
                <circle cx={CORE.x} cy={CORE.y} r="28"
                  stroke="currentColor" strokeWidth="0.8" fill="hsl(var(--card))" />
                <circle cx={CORE.x} cy={CORE.y} r="29"
                  stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0">
                  <animate attributeName="r" values="26;38;26" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0;0.25" dur="4s" repeatCount="indefinite" />
                </circle>
                <text x={CORE.x} y={CORE.y - 4} textAnchor="middle"
                  fontSize="8" fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">
                  Omni
                </text>
                <text x={CORE.x} y={CORE.y + 7} textAnchor="middle"
                  fontSize="8" fill="currentColor" fontFamily="Inter" fontWeight="600" opacity="0.8">
                  Desk
                </text>
              </g>

              {/* Tool nodes */}
              {nodes.map((n) => (
                <FlowNode
                  key={n.id}
                  node={{ ...n, position: localPositions[n.id] ?? getNodePos(n.position.x, n.position.y) }}
                  onSelect={setSelectedNode}
                  isSelected={selectedNode?.id === n.id}
                  onDragStart={handleNodeDragStart}
                />
              ))}
            </g>
          </svg>
        </div>

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
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-sans px-5 py-2.5 pointer-events-none whitespace-nowrap"
            style={{ background: "hsl(var(--background))", borderRadius: "50px", border: "1px solid rgba(26,26,26,0.08)", boxShadow: "var(--shadow-subtle)" }}
          >
            Scroll to zoom · Drag canvas to pan · Drag nodes to reposition
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-6 md:px-8 py-3.5 flex items-center gap-6 flex-wrap text-xs font-sans text-muted-foreground"
        style={{ borderTop: "1px solid rgba(26,26,26,0.08)" }}>
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
