import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { DEMO_JSONL } from "./demo";
import { parseJSONL } from "./parser";
import { computeGraph } from "./graph";
import { Legend } from "./ui/Legend";
import { Toolbar } from "./ui/Toolbar";
import { Uploader } from "./ui/Uploader";
import { runSelfTests } from "./tests/selfTests";

type Options = {
  showRelated: boolean; showParentChild: boolean; showDiscoveredFrom: boolean;
  invertDirection: boolean; orientation: "TB" | "LR"; allowRelatedNudge: boolean; groupIsolates: boolean;
};
type Filters = { q: string; show: any };

export default function App() {
  const [raw, setRaw] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[] | null>(null);
  const [options, setOptions] = useState<Options>({ showRelated: true, showParentChild: true, showDiscoveredFrom: false, invertDirection: false, orientation: "TB", allowRelatedNudge: true, groupIsolates: true });
  const [collapsed, setCollapsed] = useState(true);
  const [expandIsolates, setExpandIsolates] = useState(false);
  const [filters, setFilters] = useState<Filters>({ q: "", show: { open: true, in_progress: true, blocked: true, closed: true } });

  const onLoad = useCallback((text: string) => { setRaw(text); setIssues(parseJSONL(text)); setCollapsed(true); }, []);
  useEffect(() => { if (!raw && !issues) onLoad(DEMO_JSONL); }, [raw, issues, onLoad]);

  const filteredIssues = useMemo(() => {
    if (!issues) return null;
    const s = filters.q.toLowerCase();
    return issues.filter((i: any) =>
      filters.show[i.status] &&
      (!s || i.title?.toLowerCase().includes(s) || i.id?.toLowerCase().includes(s) || (i.assignee ?? "").toLowerCase().includes(s) || (i.description ?? "").toLowerCase().includes(s))
    );
  }, [issues, filters]);

  const graph = useMemo(() => filteredIssues ? computeGraph(filteredIssues, options) : { nodes: [], edges: [], meta: { isolates: [] } }, [filteredIssues, options]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  useEffect(() => { setNodes(graph.nodes); setEdges(graph.edges); }, [graph.nodes, graph.edges]);

  // Ensure viewport fits whenever nodes change (initial mount + data load)
  const rfRef = useRef<ReactFlowInstance | null>(null);
  useEffect(() => {
    if (rfRef.current && nodes.length > 0) {
      try { rfRef.current.fitView({ padding: 0.2, includeHiddenNodes: true }); } catch {}
    }
  }, [nodes.length]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const neighborMap = useMemo(() => {
    const m = new Map<string, Set<string>>(); nodes.forEach(n => m.set(n.id, new Set<string>()));
    edges.forEach(e => { m.get(e.source)?.add(e.target); m.get(e.target)?.add(e.source); });
    return m;
  }, [nodes, edges]);
  const neighborIds = useMemo(() => hoveredId ? new Set([hoveredId, ...(neighborMap.get(hoveredId) ?? new Set())]) : new Set<string>(), [hoveredId, neighborMap]);

  const bucketNode = useMemo(() => nodes.find(n => n.id === "__isolates__"), [nodes]);
  const fanoutNodes = useMemo(() => {
    if (!expandIsolates || !bucketNode) return [] as Node[];
    const isolates = ((bucketNode.data as any)?.isolates as Node[]) ?? [];
    const cols = 3, gapX = 16, gapY = 16;
    return isolates.map((iso, idx) => {
      const col = idx % cols, row = Math.floor(idx / cols);
      const x = options.orientation === "TB" ? bucketNode.position.x + 280 + col * (240 + gapX) : bucketNode.position.x + col * (240 + gapX);
      const y = options.orientation === "TB" ? bucketNode.position.y + row * (72 + gapY) : bucketNode.position.y + 200 + row * (72 + gapY);
      return { ...iso, position: { x, y }, selectable: true, draggable: false } as Node;
    });
  }, [expandIsolates, bucketNode, options.orientation]);

  const baseNodes = useMemo(() => bucketNode && expandIsolates ? [...nodes, ...fanoutNodes] : nodes, [nodes, bucketNode, expandIsolates, fanoutNodes]);

  const displayNodes = useMemo(() => {
    if (!hoveredId) return baseNodes;
    return baseNodes.map(n => ({ ...n, style: { ...n.style, opacity: neighborIds.has(n.id) ? 1 : 0.2, boxShadow: neighborIds.has(n.id) ? "0 4px 14px rgba(0,0,0,0.12)" : (n.style as any)?.boxShadow } }));
  }, [baseNodes, hoveredId, neighborIds]);

  const displayEdges = useMemo(() => {
    if (!hoveredId) return edges;
    return edges.map(e => ({ ...e, style: { ...(e.style ?? {}), opacity: (e.source === hoveredId || e.target === hoveredId || (neighborIds.has(e.source) && neighborIds.has(e.target))) ? 1 : 0.1 } }));
  }, [edges, hoveredId, neighborIds]);

  const onNodesChange = useCallback((c: any) => setNodes(nds => applyNodeChanges(c, nds)), []);
  const onEdgesChange = useCallback((c: any) => setEdges(eds => applyEdgeChanges(c, eds)), []);
  const onConnect     = useCallback((p: any) => setEdges(eds => addEdge(p, eds)), []);

  const testResults = useMemo(() => runSelfTests(), []);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 12, padding: 12, background: '#f8fafc', position: 'relative' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="px-2 py-1 border rounded-md text-xs" onClick={() => onLoad(DEMO_JSONL)}>Load demo</button>
        <div style={{ width: 16 }} />
        <Uploader onLoad={onLoad} />
        <Toolbar options={options as any} setOptions={setOptions} filters={filters} setFilters={setFilters} hasGraph={!!issues} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      <div style={{ minHeight: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', background: '#fff', position: 'relative' }}>
        <ReactFlow
          style={{ width: '100%', height: '80vh' }}
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => { rfRef.current = instance; instance.fitView({ padding: 0.2, includeHiddenNodes: true }); }}
          onNodeMouseEnter={(_, n) => setHoveredId(n.id)}
          onNodeMouseLeave={() => setHoveredId(null)}
          onNodeClick={(_, n) => { if (n.id === "__isolates__") setExpandIsolates(v => !v); }}
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background />
        </ReactFlow>
        <Legend />
      </div>

      <div className="max-w-6xl mx-auto w-full grid gap-2">
        {raw && (
          <details className="text-xs opacity-70">
            <summary className="cursor-pointer">Debug: first 2 lines</summary>
            <pre className="whitespace-pre-wrap break-all p-3 bg-white rounded-xl border shadow mt-2">
              {raw.split(/\r?\n/).slice(0, 2).join("\n")}
            </pre>
          </details>
        )}
        <details className="text-xs opacity-70">
          <summary className="cursor-pointer">Parser & layout tests</summary>
          <div className="p-3 bg-white rounded-xl border shadow mt-2 space-y-1">
            {testResults.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`inline-block w-2 h-2 rounded-full mt-1 ${r.pass ? "bg-green-500" : "bg-red-500"}`} />
                <div><div className="font-medium">{r.name}</div>{!r.pass && <div className="text-red-600">{r.detail}</div>}</div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
