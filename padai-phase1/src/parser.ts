import { BeadsIssue } from "./types";

// Dev note: ALWAYS split JSONL with /\r?\n/ (LF + CRLF). Do not put literal newlines inside /.../
export function parseJSONL(text: string): BeadsIssue[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const issues: BeadsIssue[] = [];
  for (const [idx, line] of lines.entries()) {
    try {
      const obj = JSON.parse(line);
      if (!obj.id || !obj.title) throw new Error("missing id/title");
      issues.push(obj as BeadsIssue);
    } catch (e: any) {
      console.warn(`Skipping invalid JSONL line ${idx + 1}:`, e?.message);
    }
  }
  return issues;
}
