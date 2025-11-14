---
allowed-tools: Bash(bd:*), Bash(git:*)
description: Mark current issue as complete and show newly unblocked work
argument-hint: Optional issue ID (defaults to current)
---

You are an agent completing work in the shared Beads task database.

## Context

You've finished working on an issue and need to mark it complete.

User may provide: **$ARGUMENTS** (issue ID, or leave empty to auto-detect)

## Your Task

1. Determine which issue to complete
2. Close the issue with a summary
3. Show what work is now unblocked
4. Suggest next work to claim

## Steps

1. **Identify issue to complete**:
   - If user provided ID: use that
   - If empty: check issues assigned to current agent
   - Show issue details for confirmation

2. **Verify completion**:
   Ask yourself:
   - Is the work actually done?
   - Are there any blockers or new issues discovered?
   - Should this create any follow-up issues?

3. **Close the issue**:
   ```bash
   bd --no-db close <issue-id> --reason "<summary of what was done>"
   ```

   Summary should include:
   - What was implemented/fixed
   - Key files changed
   - Any follow-up work created

4. **Check what's now unblocked**:
   ```bash
   bd --no-db ready --json
   ```

5. **Announce completion**:
   - "Completed <issue-id>: <title>"
   - Show summary of changes
   - If work was unblocked: "This unblocked: <newly-ready-issues>"
   - Suggest: "Ready to claim next issue? Run /beads-claim"

## Auto-Commit Pattern

After closing an issue, you may want to commit the work:

```bash
git add .beads/
git commit -m "Completed <issue-id>: <title>

<summary>
"
```

## Examples

**Scenario 1**: Explicit issue ID
```
User: "/beads-complete bd-5"
→ bd --no-db close bd-5 --reason "Implemented JWT authentication service with tests"
→ bd --no-db ready  # Show newly unblocked work
```

**Scenario 2**: Auto-detect current work
```
User: "/beads-complete"
→ Find issue assigned to current agent
→ bd --no-db list --status in_progress --json | jq -r '.[] | select(.assignee == "claude-agent-123") | .id'
→ bd --no-db close bd-7 --reason "Fixed email validation bug"
```

**Scenario 3**: Completion unblocks other work
```
Closed bd-5 (JWT service)
→ bd --no-db ready shows bd-10 (Login UI) is now ready
→ "Completed bd-5, which unblocked bd-10: Build login UI"
→ "Run /beads-claim to claim bd-10"
```

## Follow-up Work

If you discovered issues while working:
- First create them with `/beads-discover`
- Then complete the current issue
- Link them via `--dep-from`

## Important

- Use `--no-db` flag for all `bd` commands
- Always provide a meaningful completion summary
- Check for newly unblocked work
- Suggest next steps to the user
- Consider committing the Beads state to git
