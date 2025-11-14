---
allowed-tools: Bash(bd:*), Bash(git:*)
description: Create a new Beads issue discovered during current work
argument-hint: Issue title and details
---

You are an agent discovering new work that needs to be done.

## Context

While working on a task, you've discovered additional work that needs to be tracked.

User will provide: **$ARGUMENTS** (the new issue title and description)

## Your Task

Create a new issue in Beads with proper dependency tracking.

## Steps

1. **Parse user input**:
   - Extract title (first line or before colon)
   - Extract description (rest of input)
   - Extract suggested priority if mentioned
   - Extract issue type (bug, feature, task)

2. **Determine current context**:
   - What issue are you currently working on? (check git branch, or ask user)
   - This new issue should be linked via `--dep-from` to show discovery chain

3. **Determine blocking relationship**:
   Ask yourself:
   - Does the current work REQUIRE this new issue to be done first? → Use `--blocks`
   - Is this related but independent? → Use `--dep-from` only
   - Is this a subtask of current work? → Use `--parent`

4. **Create the issue**:
   ```bash
   bd --no-db create "<title>" \
     -d "<description>" \
     --type <bug|feature|task> \
     --priority <0-4> \
     --dep-from <current-issue-id> \
     [--blocks <current-issue-id>]  # Only if it blocks current work
   ```

5. **Announce creation**:
   - Show the created issue ID
   - Explain the relationship to current work
   - If it blocks current work, explain you may need to switch to it

## Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - General work item (tests, refactoring, docs)

## Priority Levels

- `0` - Critical (blocks everything)
- `1` - High (core functionality)
- `2` - Medium (nice-to-have)
- `3` - Low (polish)
- `4` - Backlog (someday)

## Examples

**User**: "Need to add error handling for API timeouts"
→ `bd --no-db create "Add error handling for API timeouts" -d "Discovered while implementing API client" --type task --priority 1 --dep-from bd-5`

**User**: "Found a bug: login form doesn't validate email format"
→ `bd --no-db create "Bug: Email validation missing in login form" -d "Email field accepts invalid formats" --type bug --priority 1 --dep-from bd-3 --blocks bd-3`

**User**: "We need to write tests for the auth module"
→ `bd --no-db create "Write tests for auth module" -d "Unit and integration tests needed" --type task --priority 2 --parent bd-1`

## Important

- Use `--no-db` flag for all `bd` commands
- Always link new issues to show where they were discovered from
- Only use `--blocks` if current work truly cannot proceed without this
- After creating, show `bd --no-db ready` to see if the new issue is immediately claimable
