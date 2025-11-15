import { EDGE_COLORS } from "../colors";

export function Legend() {
  return (
    <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(2px)', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="font-semibold mb-1">Legend</div>
      <div className="flex items-center gap-2"><span style={{ width: 28, height: 0, borderTop: `2px solid ${EDGE_COLORS["blocks"]}` }} /> blocks</div>
      <div className="flex items-center gap-2 mt-1"><span style={{ width: 28, height: 0, borderTop: `1px dotted ${EDGE_COLORS["related"]}` }} /> related</div>
      <div className="flex items-center gap-2 mt-1"><span style={{ width: 28, height: 0, borderTop: `1px dashed ${EDGE_COLORS["parent-child"]}` }} /> parent-child</div>
      <div className="flex items-center gap-2 mt-1"><span style={{ width: 28, height: 0, borderTop: `1px dashed ${EDGE_COLORS["discovered-from"]}` }} /> discovered-from</div>
    </div>
  );
}
