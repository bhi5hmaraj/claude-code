---
allowed-tools: Bash(bd:*)
description: Claim the next ready issue from Beads and start working on it
---

You are an agent claiming work from the shared Beads task database.

## Your Task

1. Find the highest priority ready issue (no blocking dependencies)
2. Claim it by setting status to `in_progress` and assignee to your agent name
3. Show the issue details so you can start working

## Steps

1. **Check for ready work**:
   ```bash
   bd --no-db ready --json
   ```

2. **If work available, claim it**:
   - Extract the first ready issue ID
   - Check if it's already assigned (race condition safety)
   - Set assignee to your agent identifier (e.g., "claude-agent-1")
   - Set status to "in_progress"

3. **Show issue details**:
   ```bash
   bd --no-db show <issue-id>
   ```

4. **Announce what you claimed**:
   - Tell the user: "Claimed issue <id>: <title>"
   - Show description and any relevant context
   - Show dependencies if any

## Agent Identifier

Your agent name should be: `claude-agent-<timestamp>`

For example: `claude-agent-1731619200`

This ensures unique identification across multiple concurrent Claude instances.

## If No Ready Work

If `bd ready` returns empty:
- Tell user: "No ready work available. All issues are either completed, blocked, or in progress."
- Show what's currently in progress: `bd --no-db list --status in_progress`
- Show what's blocked: `bd --no-db blocked`

## Race Condition Safety

Before claiming, verify the issue isn't already assigned:
```bash
CURRENT_ASSIGNEE=$(bd --no-db show <issue-id> --json | jq -r '.assignee // empty')
```

If already assigned, skip and try the next ready issue.

## Important

- Use `--no-db` flag for all `bd` commands (JSONL mode)
- You have capability to call multiple tools in a single response - use it to be efficient
- After claiming, you should immediately start working on the issue
