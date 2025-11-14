---
allowed-tools: Bash(bd:*)
description: Show multi-agent coordination status and work distribution
---

You are monitoring the shared Beads task database across multiple agents.

## Your Task

Provide a comprehensive overview of:
1. What work is in progress (and by whom)
2. What work is ready to be claimed
3. What work is blocked
4. Overall progress statistics

## Steps

1. **Work In Progress**:
   ```bash
   bd --no-db list --status in_progress --json
   ```

   Show:
   - Issue ID and title
   - Assignee (which agent)
   - How long in progress (created vs updated time)

2. **Ready Work** (unblocked, claimable):
   ```bash
   bd --no-db ready --json
   ```

   Show:
   - Issue ID and title
   - Priority
   - Number of dependencies (should be 0)

3. **Blocked Work**:
   ```bash
   bd --no-db blocked --json
   ```

   Show:
   - Issue ID and title
   - What's blocking it (dependency IDs)
   - Priority

4. **Overall Statistics**:
   ```bash
   bd --no-db list --json | jq 'group_by(.status) | map({status: .[0].status, count: length})'
   ```

   Show:
   - Total issues
   - Breakdown by status (open, in_progress, completed)
   - Completion percentage

5. **Dependency Visualization** (if any issues have deps):
   ```bash
   bd --no-db dep tree --all | head -30
   ```

## Output Format

Present the information clearly:

```
=== Multi-Agent Beads Status ===

📊 Overall Progress:
  • Total issues: 15
  • Completed: 7 (47%)
  • In progress: 3 (20%)
  • Ready: 2 (13%)
  • Blocked: 3 (20%)

🔄 Currently In Progress:
  [claude-agent-1] bd-5: Implement JWT authentication (2m ago)
  [claude-agent-2] bd-8: Build login UI (5m ago)
  [claude-agent-3] bd-12: Write integration tests (1m ago)

✅ Ready to Claim (High Priority First):
  P1: bd-10: Add password reset flow
  P2: bd-14: Update documentation

🚫 Blocked Work:
  bd-6: Deploy to production (blocked by: bd-5, bd-8)
  bd-11: End-to-end tests (blocked by: bd-12)

🔗 Critical Dependencies:
  bd-1 (Epic: User Auth)
    ├─ bd-5 (JWT auth) [in_progress @claude-agent-1]
    ├─ bd-8 (Login UI) [in_progress @claude-agent-2]
    └─ bd-10 (Password reset) [ready]

💡 Suggestions:
  • 2 high-priority issues ready to claim
  • Agent-1 completing bd-5 will unblock bd-6
  • Consider claiming bd-10 (no blockers)
```

## Advanced Analysis

If user wants deeper insights:

**Agent productivity**:
```bash
bd --no-db list --status completed --json | jq 'group_by(.assignee) | map({agent: .[0].assignee, completed: length})'
```

**Bottleneck detection**:
```bash
bd --no-db list --json | jq '.[] | select(.dependent_count > 2) | {id, title, blocks: .dependent_count}'
```

**Stale work** (in progress too long):
```bash
bd --no-db list --status in_progress --json | jq '.[] | select((.updated_at | fromdateiso8601) < (now - 3600)) | {id, title, assignee}'
```

## Important

- Use `--no-db` flag for all `bd` commands
- Present information visually with emojis and structure
- Highlight actionable insights
- Suggest next steps (what to claim, what's urgent)
