import { computeGraph } from "../graph";
import { parseJSONL } from "../parser";
import { BeadsIssue } from "../types";

export function runSelfTests() {
  type Res = { name: string; pass: boolean; detail?: string };
  const results: Res[] = [];
  const t = (name: string, fn: () => void) => { try { fn(); results.push({ name, pass: true }); } catch (e: any) { results.push({ name, pass: false, detail: e?.message }); } };
  const eq = (a: any, b: any) => { const ja = JSON.stringify(a), jb = JSON.stringify(b); if (ja !== jb) throw new Error(`expected ${jb}, got ${ja}`); };

  t("splits on LF (\\n)", () => {
    const src = '{"id":"A","title":"One"}\\n{"id":"B","title":"Two"}\\n';
    eq(parseJSONL(src).map(x => x.id), ["A","B"]);
  });

  t("splits on CRLF (\\r\\n)", () => {
    const src = '{"id":"C","title":"Three"}\\r\\n{"id":"D","title":"Four"}\\r\\n';
    eq(parseJSONL(src).map(x => x.id), ["C","D"]);
  });

  t("ignores blank lines and trims", () => {
    const src = "\\n  \\n {\\\"id\\\":\\\"E\\\",\\\"title\\\":\\\"Five\\\"} \\n";
    eq(parseJSONL(src).map(x => x.id), ["E"]);
  });

  t("skips invalid JSON and continues", () => {
    const src = '{"id":"F","title":"Six"}\\nnot_json\\n{"id":"G","title":"Seven"}\\n';
    eq(parseJSONL(src).map(x => x.id), ["F","G"]);
  });

  t("DAG layout TB orders A→B→C", () => {
    const issues: BeadsIssue[] = [
      { id: "A", title: "A", status: "open", priority: 1, issue_type: "task", dependencies: [] },
      { id: "B", title: "B", status: "open", priority: 1, issue_type: "task", dependencies: [{ issue_id: "B", depends_on_id: "A", type: "blocks" }] },
      { id: "C", title: "C", status: "open", priority: 1, issue_type: "task", dependencies: [{ issue_id: "C", depends_on_id: "B", type: "blocks" }] },
    ];
    const { nodes } = computeGraph(issues, { showRelated: false, showParentChild: false, showDiscoveredFrom: false, invertDirection: false, orientation: "TB", allowRelatedNudge: true, groupIsolates: false });
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    if (!(byId["A"].position.y < byId["B"].position.y && byId["B"].position.y < byId["C"].position.y)) {
      throw new Error("expected y(A) < y(B) < y(C)");
    }
  });

  t("related edges dotted & colored", () => {
    const issues: BeadsIssue[] = [
      { id: "R1", title: "R1", status: "open", priority: 1, issue_type: "task", dependencies: [{ issue_id: "R1", depends_on_id: "R2", type: "related" }] },
      { id: "R2", title: "R2", status: "open", priority: 1, issue_type: "task", dependencies: [] },
    ];
    const { edges } = computeGraph(issues, { showRelated: true, showParentChild: false, showDiscoveredFrom: false, invertDirection: false, orientation: "TB", allowRelatedNudge: true, groupIsolates: false });
    const rel = edges.find(e => (e.data as any)?.depType === "related");
    if (!rel) throw new Error("no related edge");
    if (!(rel.style as any)?.strokeDasharray) throw new Error("related should be dashed/dotted");
    if (!(rel.style as any)?.stroke) throw new Error("related should have stroke color");
  });

  t("blocks edges are solid", () => {
    const issues: BeadsIssue[] = [
      { id: "A", title: "A", status: "open", priority: 1, issue_type: "task", dependencies: [] },
      { id: "B", title: "B", status: "open", priority: 1, issue_type: "task", dependencies: [{ issue_id: "B", depends_on_id: "A", type: "blocks" }] },
    ];
    const { edges } = computeGraph(issues, { showRelated: false, showParentChild: false, showDiscoveredFrom: false, invertDirection: false, orientation: "TB", allowRelatedNudge: false, groupIsolates: false });
    const e = edges.find(e => (e.data as any)?.depType === "blocks");
    if (!e) throw new Error("no blocks edge");
    const dash = (e.style as any)?.strokeDasharray;
    if (dash && dash !== "none") throw new Error("blocks should be solid");
  });

  t("isolates bucket + meta", () => {
    const issues: BeadsIssue[] = [
      { id: "A", title: "A", status: "open", priority: 1, issue_type: "task", dependencies: [] },
      { id: "B", title: "B", status: "open", priority: 1, issue_type: "task", dependencies: [{ issue_id: "B", depends_on_id: "A", type: "blocks" }] },
      { id: "X1", title: "X1", status: "open", priority: 0, issue_type: "task" },
      { id: "X2", title: "X2", status: "open", priority: 0, issue_type: "task" },
    ];
    const { nodes, meta } = computeGraph(issues, { showRelated: false, showParentChild: false, showDiscoveredFrom: false, invertDirection: false, orientation: "TB", allowRelatedNudge: false, groupIsolates: true });
    const ids = new Set(nodes.map(n => n.id));
    if (!ids.has("__isolates__")) throw new Error("missing bucket");
    if (ids.has("X1") || ids.has("X2")) throw new Error("isolates should be removed");
    if (!meta || !Array.isArray(meta.isolates) || meta.isolates.length !== 2) throw new Error("meta.isolates mismatch");
  });

  t("layout handles empty graph", () => {
    const { nodes } = computeGraph([], { showRelated: true, showParentChild: true, showDiscoveredFrom: false, invertDirection: false, orientation: "TB", allowRelatedNudge: true, groupIsolates: true });
    eq(Array.isArray(nodes), true);
  });

  return results;
}
