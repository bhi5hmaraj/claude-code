---
allowed-tools: Bash(bd:*), Bash(git:*)
description: Sync Beads database across agents via git
---

You are synchronizing the shared Beads database across multiple agent instances.

## Your Task

1. Export current Beads state to JSONL
2. Commit and push to git
3. Pull latest changes from other agents
4. Import merged JSONL state

This ensures all agents see the same task state.

## Steps

### 1. Export Current State

```bash
bd --no-db export > .beads/issues.jsonl
```

This ensures any in-memory changes are written to disk.

### 2. Check Git Status

```bash
git status .beads/
```

See if there are changes to commit.

### 3. Commit Changes

```bash
git add .beads/
git commit -m "Beads sync: $(date +'%Y-%m-%d %H:%M:%S')

$(bd --no-db list --status in_progress --json | jq -r '.[] | "- [\(.assignee)] \(.id): \(.title)"')
"
```

### 4. Pull Latest (Handle Conflicts)

```bash
git pull --rebase origin $(git branch --show-current)
```

If there are conflicts in `.beads/issues.jsonl`:
- Beads has a custom 3-way merge driver
- It should auto-resolve most conflicts
- If manual resolution needed, use: `bd --no-db merge`

### 5. Import Merged State

```bash
bd --no-db import .beads/issues.jsonl
```

### 6. Push Changes

```bash
git push origin $(git branch --show-current)
```

## Auto-Sync Pattern

Beads has built-in auto-sync (5s debounce):
- After CRUD operations → auto-exports to JSONL
- Before reading (if JSONL newer) → auto-imports

Manual sync is only needed when:
- Forcing immediate sync before git operations
- Resolving conflicts
- Coordinating with other agents explicitly

## Sync Frequency

**Recommended**:
- Before claiming work: Sync to see latest state
- After completing work: Sync to share completion
- Every 5-10 minutes during long tasks: Stay coordinated

**Example cron pattern**:
```bash
# Sync every 5 minutes
*/5 * * * * cd /path/to/project && bd --no-db export > .beads/issues.jsonl && git add .beads/ && git commit -m "Auto-sync" && git pull && git push
```

## Conflict Resolution

If merge conflicts occur:

```bash
# Check conflict
git status .beads/issues.jsonl

# Use Beads 3-way merge
bd --no-db merge .beads/issues.jsonl

# Verify result
bd --no-db list

# Complete merge
git add .beads/issues.jsonl
git rebase --continue
```

## Output

After sync, show:
- What changed (new issues, completed issues, status changes)
- Current ready work
- Any conflicts resolved

```
=== Beads Sync Complete ===

📥 Pulled changes:
  • New issues: bd-15, bd-16 (created by claude-agent-2)
  • Completed: bd-8 (Login UI, by claude-agent-3)
  • Status changes: bd-10 now in_progress

📤 Pushed changes:
  • Completed: bd-5 (JWT auth)
  • New issues: bd-17 (error handling)

✅ Ready work after sync:
  • bd-10: Add password reset (P1)
  • bd-14: Update docs (P2)

🔄 Sync successful - database synchronized across agents
```

## Important

- Use `--no-db` flag for all `bd` commands
- Always pull before push to avoid conflicts
- Trust Beads' merge driver for conflict resolution
- Communicate sync status clearly to user
