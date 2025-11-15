import { BeadsStatus } from "../types";
import { Toggle } from "./Toggle";

export function Toolbar({
  options, setOptions, filters, setFilters, hasGraph, collapsed, setCollapsed,
}: {
  options: { showRelated: boolean; showParentChild: boolean; showDiscoveredFrom: boolean; invertDirection: boolean; orientation: "TB" | "LR"; allowRelatedNudge: boolean; groupIsolates: boolean; };
  setOptions: (o: any) => void;
  filters: { q: string; show: Record<BeadsStatus, boolean>; };
  setFilters: (f: any) => void;
  hasGraph: boolean;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  if (collapsed) {
    return (
      <div className="flex items-center gap-3 p-2 border rounded-xl shadow-sm bg-white text-xs">
        <button className="px-2 py-1 border rounded-md" onClick={() => setCollapsed(false)}>Controls ▾</button>
        <input className="px-2 py-1 border rounded-md text-xs w-48" placeholder="Search…" value={filters.q}
              onChange={(e) => setFilters((f: any) => ({ ...f, q: e.currentTarget.value }))} />
        <span className="opacity-60">{hasGraph ? "hover to highlight" : "load data"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 border rounded-xl shadow-sm bg-white">
      <button className="px-2 py-1 border rounded-md text-xs" onClick={() => setCollapsed(true)}>Hide ▴</button>

      <Toggle label="Related" value={options.showRelated} onChange={(v) => setOptions((o: any) => ({ ...o, showRelated: v }))} />
      <Toggle label="Parent-child" value={options.showParentChild} onChange={(v) => setOptions((o: any) => ({ ...o, showParentChild: v }))} />
      <Toggle label="Discovered-from" value={options.showDiscoveredFrom} onChange={(v) => setOptions((o: any) => ({ ...o, showDiscoveredFrom: v }))} />

      <label className="inline-flex items-center gap-2">
        <span className="text-sm">Top-down</span>
        <input type="checkbox" checked={options.orientation === "TB"} onChange={(e) => setOptions((o: any) => ({ ...o, orientation: e.currentTarget.checked ? "TB" : "LR" }))} />
      </label>

      <Toggle label="Invert arrows" value={options.invertDirection} onChange={(v) => setOptions((o: any) => ({ ...o, invertDirection: v }))} />
      <Toggle label="Nudge by related" value={options.allowRelatedNudge} onChange={(v) => setOptions((o: any) => ({ ...o, allowRelatedNudge: v }))} />
      <Toggle label="Group isolates" value={options.groupIsolates} onChange={(v) => setOptions((o: any) => ({ ...o, groupIsolates: v }))} />

      <div className="flex items-center gap-2 ml-2">
        <input className="px-2 py-1 border rounded-md text-sm w-56" placeholder="Search title / id / assignee"
              value={filters.q} onChange={(e) => setFilters((f: any) => ({ ...f, q: e.currentTarget.value }))} />
      </div>

      <div className="flex items-center gap-3 ml-2 text-sm">
        {(["open", "in_progress", "blocked", "closed"] as BeadsStatus[]).map(s => (
          <label key={s} className="inline-flex items-center gap-1">
            <input type="checkbox" checked={filters.show[s]}
                  onChange={(e) => setFilters((f: any) => ({ ...f, show: { ...f.show, [s]: e.currentTarget.checked } }))} />
            <span>{s.replace("_", " ")}</span>
          </label>
        ))}
      </div>

      <div className="ml-auto text-xs opacity-70">
        {hasGraph ? "Hover to highlight neighbors · Click isolate bucket to fan out" : "Load a .jsonl or use demo"}
      </div>
    </div>
  );
}
