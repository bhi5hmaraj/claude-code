// Beads CLI Wrapper
// Spawns bd commands and returns parsed output

import { spawn } from 'child_process';

export interface BeadsIssue {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'blocked' | 'closed';
  priority: number;
  issue_type: string;
  assignee?: string;
  dependencies?: Array<{
    issue_id: string;
    depends_on_id: string;
    type: string;
  }>;
}

export interface BeadsExecuteOptions {
  cwd?: string;
  timeout?: number;
}

/**
 * Execute bd CLI command and return output
 */
export async function executeBd(
  args: string[],
  options: BeadsExecuteOptions = {}
): Promise<string> {
  const { cwd = process.cwd(), timeout = 10000 } = options;

  return new Promise((resolve, reject) => {
    const proc = spawn('bd', ['--no-db', ...args], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Timeout handling
    const timeoutId = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`bd command timed out after ${timeout}ms`));
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        console.error(`bd command failed with code ${code}:`, stderr);
        reject(new Error(`bd command failed: ${stderr || stdout}`));
        return;
      }

      resolve(stdout.trim());
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn bd: ${err.message}`));
    });
  });
}

/**
 * Get all tasks with current status
 */
export async function getStatus(): Promise<BeadsIssue[]> {
  const output = await executeBd(['list', '--json']);

  if (!output) {
    return [];
  }

  try {
    const issues = JSON.parse(output);
    return Array.isArray(issues) ? issues : [];
  } catch (err) {
    console.error('Failed to parse bd output:', err);
    throw new Error('Invalid JSON from bd list command');
  }
}

/**
 * Get all ready tasks (no blocking dependencies)
 */
export async function getReadyTasks(): Promise<BeadsIssue[]> {
  const output = await executeBd(['ready', '--json']);

  if (!output) {
    return [];
  }

  try {
    const issues = JSON.parse(output);
    return Array.isArray(issues) ? issues : [];
  } catch (err) {
    console.error('Failed to parse bd ready output:', err);
    throw new Error('Invalid JSON from bd ready command');
  }
}

/**
 * Update task status and assignee
 */
export async function updateTask(
  taskId: string,
  updates: {
    status?: string;
    assignee?: string;
    notes?: string;
  }
): Promise<void> {
  const args = ['update', taskId];

  if (updates.status) {
    args.push('--status', updates.status);
  }

  if (updates.assignee) {
    args.push('--assignee', updates.assignee);
  }

  if (updates.notes) {
    args.push('--notes', updates.notes);
  }

  await executeBd(args);
}

/**
 * Get specific task by ID
 */
export async function getTask(taskId: string): Promise<BeadsIssue | null> {
  const allTasks = await getStatus();
  return allTasks.find(task => task.id === taskId) || null;
}
