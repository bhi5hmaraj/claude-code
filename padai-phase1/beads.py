"""
Wrapper for bd CLI commands using --no-db mode.
"""
import subprocess
import json
from typing import Dict, List, Optional, Any


class BeadsError(Exception):
    """Exception raised when bd command fails."""
    pass


def execute_bd(args: List[str], cwd: str = "/workspace") -> str:
    """
    Execute bd command with --no-db flag.

    Args:
        args: Command arguments to pass to bd
        cwd: Working directory (should contain .beads/ folder)

    Returns:
        stdout from the command

    Raises:
        BeadsError: If command fails or times out
    """
    cmd = ["bd", "--no-db"] + args

    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            raise BeadsError(f"bd command failed: {result.stderr}")

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        raise BeadsError("bd command timed out after 10s")
    except FileNotFoundError:
        raise BeadsError("bd CLI not found. Install from https://github.com/steveyegge/beads")


def get_status(cwd: str = "/workspace") -> Dict[str, Any]:
    """
    Get current Beads project status.

    Returns dict with:
    - total: total issues
    - ready: ready to work
    - in_progress: currently in progress
    - completed: done
    """
    output = execute_bd(["status"], cwd)

    # Parse status output
    # Example format:
    #   Total Issues:      18
    #   Open:              18
    #   In Progress:       0
    #   Closed:            0
    #   Ready to Work:     0
    status = {
        "total": 0,
        "ready": 0,
        "in_progress": 0,
        "completed": 0
    }

    for line in output.split('\n'):
        line = line.strip()
        if 'Total Issues:' in line:
            status['total'] = int(line.split(':')[1].strip())
        elif 'Ready to Work:' in line:
            status['ready'] = int(line.split(':')[1].strip())
        elif 'In Progress:' in line:
            status['in_progress'] = int(line.split(':')[1].strip())
        elif 'Closed:' in line:
            status['completed'] = int(line.split(':')[1].strip())

    return status


def get_ready_tasks(cwd: str = "/workspace") -> List[Dict[str, Any]]:
    """
    Get list of tasks that are ready to work on.

    Returns list of task dicts with id, title, status, etc.
    """
    output = execute_bd(["ready"], cwd)

    tasks = []
    for line in output.split('\n'):
        line = line.strip()
        # Skip empty lines and headers
        if not line or line.startswith('📋') or line.startswith('#'):
            continue

        # Parse format: "1. [P0] padai-10: Deploy to Railway"
        if '. [P' in line and ':' in line:
            # Extract task ID and title after the colon
            try:
                # Split on colon to separate "ID" from "title"
                parts = line.split(':', 1)
                if len(parts) >= 2:
                    # Extract ID from "1. [P0] padai-10"
                    id_part = parts[0].strip()
                    # Get the last word which should be the task ID
                    task_id = id_part.split()[-1]
                    # Get the title (everything after the colon)
                    title = parts[1].strip()

                    tasks.append({
                        "id": task_id,
                        "title": title,
                        "status": "ready"
                    })
            except:
                continue

    return tasks


def get_all_tasks(cwd: str = "/workspace") -> List[Dict[str, Any]]:
    """
    Get all tasks with full details including dependencies.

    Returns list of task dicts parsed from JSONL.
    """
    import os

    jsonl_path = os.path.join(cwd, ".beads", "issues.jsonl")

    if not os.path.exists(jsonl_path):
        return []

    tasks = []
    with open(jsonl_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    task = json.loads(line)
                    tasks.append(task)
                except json.JSONDecodeError:
                    continue

    return tasks


def update_task(task_id: str, status: Optional[str] = None,
                assignee: Optional[str] = None, cwd: str = "/workspace") -> bool:
    """
    Update a task's status or assignee.

    Args:
        task_id: Task ID to update
        status: New status (ready, in_progress, completed)
        assignee: Agent name to assign to

    Returns:
        True if successful
    """
    try:
        if status:
            execute_bd(["update", task_id, "--status", status], cwd)

        if assignee:
            execute_bd(["update", task_id, "--assignee", assignee], cwd)

        return True

    except BeadsError:
        return False


def claim_task(agent_name: str, cwd: str = "/workspace") -> Optional[Dict[str, Any]]:
    """
    Claim the first available ready task for an agent.

    Args:
        agent_name: Name of the agent claiming the task

    Returns:
        Task dict if successful, None if no tasks available
    """
    ready = get_ready_tasks(cwd)

    if not ready:
        return None

    task = ready[0]

    # Update to in_progress and assign
    success = update_task(task['id'], status="in_progress", assignee=agent_name, cwd=cwd)

    if success:
        # Get full task details
        all_tasks = get_all_tasks(cwd)
        for t in all_tasks:
            if t.get('id') == task['id']:
                return t
        return task

    return None


def complete_task(task_id: str, cwd: str = "/workspace") -> bool:
    """
    Mark a task as completed.

    Args:
        task_id: Task ID to complete

    Returns:
        True if successful
    """
    return update_task(task_id, status="completed", cwd=cwd)
