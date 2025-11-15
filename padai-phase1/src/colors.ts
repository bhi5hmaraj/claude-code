import { BeadsDependencyType, BeadsStatus } from "./types";

export const EDGE_COLORS: Record<BeadsDependencyType, string> = {
  blocks: "#0f172a",
  related: "#64748b",
  "parent-child": "#8b5cf6",
  "discovered-from": "#0ea5e9",
};

export function colorForStatus(status: BeadsStatus) {
  switch (status) {
    case "open":        return { bg: "#FFF7ED", border: "#F97316", fg: "#7C2D12" };
    case "in_progress": return { bg: "#EFF6FF", border: "#3B82F6", fg: "#1E3A8A" };
    case "blocked":     return { bg: "#FEF2F2", border: "#EF4444", fg: "#7F1D1D" };
    case "closed":      return { bg: "#F0FDF4", border: "#22C55E", fg: "#064E3B" };
    default:            return { bg: "#FFFFFF", border: "#e5e7eb", fg: "#111827" };
  }
}
