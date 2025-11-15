import React from "react";
import { MarkerType, Edge, Node, Position } from "reactflow";
import { EDGE_COLORS, colorForStatus } from "./colors";
import { applyDagreLayout } from "./layout";
import { BeadsDependencyType, BeadsIssue } from "./types";

export function styleForDep(depType: BeadsDependencyType) {
  switch (depType) {
    case "blocks":          return { style: { strokeWidth: 2,  strokeDasharray: "none" } };
    case "related":         return { style: { strokeDasharray: "2 6" } };
    case "parent-child":    return { style: { strokeDasharray: "6 6" } };
    case "discovered-from": return { style: { strokeDasharray: "3 6" } };
    default:                return { style: {} };
  }
}

export function computeGraph(
  issues: BeadsIssue[],
  options: {
    showRelated: boolean;
    showParentChild: boolean;
    showDiscoveredFrom: boolean;
    invertDirection: boolean;
    orientation: "TB" | "LR";
    allowRelatedNudge: boolean;
    groupIsolates: boolean;
  },
): { nodes: Node[]; edges: Edge[]; meta: { isolates: Node[] } } {
  let nodes: Node[] = issues.map(issue => {
    const color = colorForStatus(issue.status);
    return {
      id: issue.id,
      data: {
        label: (
          <div className="flex flex-col">
            <div className="text-sm font-semibold leading-tight">{issue.title}</div>
            <div className="text-[10px] opacity-70">{issue.id} · {issue.issue_type} · P{issue.priority} · {issue.status}</div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      sourcePosition: options.orientation === "TB" ? Position.Bottom : Position.Right,
      targetPosition: options.orientation === "TB" ? Position.Top    : Position.Left,
      style: { borderRadius: 16, padding: 10, border: `1px solid ${color.border}`, background: color.bg, color: color.fg, boxShadow: `0 2px 10px rgba(0,0,0,0.08)`, width: 240 },
    } satisfies Node;
  });

  const idx = new Map<string, BeadsIssue>(issues.map(i => [i.id, i]));
  const edges: Edge[] = [];

  const pushEdge = (from: string, to: string, depType: BeadsDependencyType) => {
    const source = options.invertDirection ? to : from;
    const target = options.invertDirection ? from : to;
    const style = styleForDep(depType).style as any;
    style.stroke = EDGE_COLORS[depType];
    if (depType === "blocks") style.strokeDasharray = "none";
    edges.push({
      id: `${source}->${target}:${depType}`,
      source, target,
      label: depType,
      animated: depType === "blocks",
      markerEnd: { type: MarkerType.ArrowClosed },
      style,
      labelStyle: { fontSize: 10, opacity: 0.8, fill: EDGE_COLORS[depType] },
      type: "default",
      data: { depType },
    });
  };

  for (const issue of issues) {
    for (const dep of issue.dependencies ?? []) {
      if (dep.type === "related"         && !options.showRelated)         continue;
      if (dep.type === "parent-child"    && !options.showParentChild)     continue;
      if (dep.type === "discovered-from" && !options.showDiscoveredFrom)  continue;
      if (!idx.has(dep.depends_on_id)) continue;
      pushEdge(dep.depends_on_id, issue.id, dep.type);
    }
  }

  const idsWithEdges = new Set<string>();
  edges.forEach(e => { idsWithEdges.add(e.source); idsWithEdges.add(e.target); });
  const isolates = nodes.filter(n => !idsWithEdges.has(n.id));

  if (options.groupIsolates && isolates.length) {
    nodes = nodes.filter(n => idsWithEdges.has(n.id));
    const preview = isolates.slice(0, 5).map(n => (n.data as any)?.label?.props?.children?.[0]?.props?.children ?? n.id);
    const more = isolates.length - preview.length;
    const label = (
      <div className="text-xs">
        <div className="font-semibold">Isolated issues ({isolates.length})</div>
        <div className="opacity-70">{preview.join(", ")}{more > 0 ? `, +${more} more` : ""}</div>
      </div>
    );
    nodes.push({
      id: "__isolates__",
      data: { label, isolates },
      position: { x: 0, y: 0 },
      sourcePosition: options.orientation === "TB" ? Position.Bottom : Position.Right,
      targetPosition: options.orientation === "TB" ? Position.Top    : Position.Left,
      style: { borderRadius: 16, padding: 10, border: `1px dashed #cbd5e1`, background: "#f8fafc", color: "#334155", width: 260 },
    });
  }

  applyDagreLayout(nodes, edges, options.orientation, options.allowRelatedNudge && options.showRelated);

  const bucket = nodes.find(n => n.id === "__isolates__");
  if (bucket) {
    const kept = nodes.filter(n => n.id !== "__isolates__");
    if (kept.length) {
      const seed = kept[0].position;
      const bounds = kept.reduce((a, n) => ({
        minX: Math.min(a.minX, n.position.x),
        minY: Math.min(a.minY, n.position.y),
        maxX: Math.max(a.maxX, n.position.x),
        maxY: Math.max(a.maxY, n.position.y),
      }), { minX: seed.x, minY: seed.y, maxX: seed.x, maxY: seed.y });
      bucket.position = options.orientation === "TB"
        ? { x: bounds.maxX + 360, y: bounds.minY }
        : { x: bounds.minX,       y: bounds.maxY + 200 };
    } else {
      bucket.position = { x: 0, y: 0 };
    }
  }

  return { nodes, edges, meta: { isolates } };
}
