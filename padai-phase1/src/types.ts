export type BeadsStatus = "open" | "in_progress" | "blocked" | "closed";
export type BeadsIssueType = "bug" | "feature" | "task" | "epic" | "chore";
export type BeadsDependencyType = "blocks" | "related" | "parent-child" | "discovered-from";

export type BeadsDependency = {
  issue_id: string;
  depends_on_id: string;
  type: BeadsDependencyType;
  created_at?: string;
  created_by?: string;
};

export type BeadsIssue = {
  id: string;
  title: string;
  description?: string;
  design?: string;
  acceptance_criteria?: string;
  notes?: string;
  status: BeadsStatus;
  priority: number;
  issue_type: BeadsIssueType;
  assignee?: string;
  estimated_minutes?: number;
  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
  external_ref?: string | null;
  dependencies?: BeadsDependency[];
};
