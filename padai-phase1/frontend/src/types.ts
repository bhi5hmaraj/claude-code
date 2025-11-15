export interface Task {
  id: string;
  title: string;
  status?: string;
  assignee?: string;
  dependencies?: Dependency[];
}

export interface Dependency {
  issue_id: string;
  depends_on_id: string;
  type: 'blocks' | 'related' | 'parent' | 'discovered-from';
}

export interface Status {
  total: number;
  ready: number;
  in_progress: number;
  completed: number;
}
