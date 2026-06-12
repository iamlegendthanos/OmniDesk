import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { WorkflowNode, NodeState } from "@/types";
import { DEFAULT_NODES, TOOL_CONFIGS } from "@/constants";

function dbRowToNode(row: Record<string, unknown>): WorkflowNode {
  const tool = row.tool as WorkflowNode["tool"];
  return {
    id: row.id as string,
    node_key: row.node_key as string,
    label: row.label as string,
    tool,
    state: row.state as NodeState,
    category: row.category as WorkflowNode["category"],
    position: { x: Number(row.pos_x), y: Number(row.pos_y) },
    uptime: Number(row.uptime ?? 0),
    workflows: (row.workflows as string[]) ?? [],
    lastSync: (row.last_sync as string) ?? "Never",
    animating: false,
  };
}

export function useWorkflowNodes() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("workflow_nodes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (data && data.length > 0) {
      setNodes(data.map(dbRowToNode));
    } else {
      // Seed defaults for new user
      const toInsert = DEFAULT_NODES.map((n) => ({
        user_id: user.id,
        node_key: n.node_key,
        label: n.label,
        tool: n.tool,
        state: n.state,
        category: n.category,
        pos_x: n.pos_x,
        pos_y: n.pos_y,
        uptime: 0,
        workflows: [],
        last_sync: "Never",
      }));
      const { data: inserted } = await supabase.from("workflow_nodes").insert(toInsert).select();
      if (inserted) setNodes(inserted.map(dbRowToNode));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const updateNodeState = useCallback(async (nodeId: string, newState: NodeState) => {
    // Trigger animation
    setNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, animating: true } : n));

    const now = new Date().toLocaleTimeString();
    const toolNode = nodes.find((n) => n.id === nodeId);
    const toolName = toolNode ? TOOL_CONFIGS[toolNode.tool].name : "";
    const workflows = newState === "bloom"
      ? [`Auto-sync ${toolName} data`, `Trigger ${toolName} webhooks`, `Update OmniDesk dashboard`]
      : [];

    await supabase.from("workflow_nodes").update({
      state: newState,
      uptime: newState === "bloom" ? 99.9 : 0,
      workflows,
      last_sync: newState === "bloom" ? now : "Never",
      updated_at: new Date().toISOString(),
    }).eq("id", nodeId);

    // End animation after 1.2s
    setTimeout(() => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, state: newState, animating: false, uptime: newState === "bloom" ? 99.9 : 0, workflows, lastSync: newState === "bloom" ? now : "Never" }
            : n
        )
      );
    }, 1200);
  }, [nodes]);

  return { nodes, loading, updateNodeState, refetch: fetchNodes };
}
