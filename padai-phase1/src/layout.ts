import dagre from "@dagrejs/dagre";
import { Edge, Position, Node } from "reactflow";

export const NODE_W = 240;
export const NODE_H = 72;

// Guard dagre with existence checks; fallback to a simple grid on failure.
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  orientation: "TB" | "LR",
  allowRelatedNudge: boolean,
) {
  if (!nodes || nodes.length === 0) return;

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: orientation, ranksep: 110, nodesep: 50, edgesep: 15, acyclicer: "greedy", ranker: "network-simplex" });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(n => n?.id && g.setNode(n.id, { width: NODE_W, height: NODE_H }));

  edges.forEach(e => {
    const t = (e.data as any)?.depType;
    if (!e.source || !e.target) return;
    if (!g.node(e.source) || !g.node(e.target)) return;
    if (t === "blocks")  g.setEdge(e.source, e.target, { weight: 2,   minlen: 1 });
    if (allowRelatedNudge && t === "related") g.setEdge(e.source, e.target, { weight: 0.2, minlen: 0 });
  });

  try {
    dagre.layout(g);
  } catch (err) {
    console.error("dagre.layout failed; using grid fallback", err);
    const cols = 4, gapX = 40, gapY = 30;
    nodes.forEach((n, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      n.position = { x: col * (NODE_W + gapX), y: row * (NODE_H + gapY) };
      n.sourcePosition = orientation === "TB" ? Position.Bottom : Position.Right;
      n.targetPosition = orientation === "TB" ? Position.Top : Position.Left;
    });
    return;
  }

  nodes.forEach(n => {
    const p = g.node(n.id);
    if (!p) return;
    n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
    n.sourcePosition = orientation === "TB" ? Position.Bottom : Position.Right;
    n.targetPosition = orientation === "TB" ? Position.Top : Position.Left;
  });
}
