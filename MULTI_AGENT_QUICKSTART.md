# Multi-Agent Claude Orchestration with Beads - Quick Start

## What Is This?

A complete system for running **multiple Claude Code instances in parallel**, coordinated via a shared Beads task database. Agents claim work, discover new tasks, and avoid conflicts through dependency tracking.

```
Multiple Claude Agents → Shared Beads DB → Coordinated Execution
```

## Quick Demo

```bash
# Run the demo (simulates 3 agents)
./examples/multi-agent-beads-demo.sh

# Watch 3 agents work together:
# - Agent 1 (Architect): Decomposes epic into subtasks
# - Agent 2 (Backend): Claims and implements JWT service
# - Agent 3 (Frontend): Works on UI components

# Result: Coordinated, dependency-aware execution
```

## Installation

Already done! ✅

- **Beads v0.23.1**: Installed and initialized
- **Claude Code v2.0.34**: Already available
- **Slash commands**: Created in `.claude/commands/`

## Available Slash Commands

### `/beads-claim`
Claims the next ready issue and starts working on it.

```bash
# Agent 1
claude
> /beads-claim

# Output: "Claimed bd-5: Implement JWT service"
# Agent now works on bd-5
```

### `/beads-discover <description>`
Creates a new issue discovered during current work.

```bash
# While working on bd-5...
> /beads-discover Need to add token refresh logic

# Creates bd-8, linked to bd-5
```

### `/beads-complete [issue-id]`
Marks issue complete, shows newly unblocked work.

```bash
> /beads-complete bd-5

# Output:
# "Completed bd-5: Implement JWT service"
# "This unblocked: bd-10 (Login UI), bd-11 (Login API)"
```

### `/beads-status`
Shows multi-agent coordination dashboard.

```bash
> /beads-status

# Output:
# In Progress:
#   [claude-agent-1] bd-5: JWT service
#   [claude-agent-2] bd-8: Login UI
# Ready:
#   bd-10: Password reset (P1)
# Blocked:
#   bd-11: Integration tests (blocked by: bd-5, bd-8)
```

### `/beads-sync`
Syncs database across agents via git.

```bash
> /beads-sync

# Pulls latest, pushes changes, resolves conflicts
```

## Usage: Multiple Claude Instances

### Terminal 1: Agent 1 (Architect)

```bash
cd /path/to/project
claude

# Create epic and decompose
bd --no-db create "Epic: User authentication" --type epic --priority 0
# ... create subtasks ...

# Or use slash command
/beads-discover Add JWT service
/beads-discover Add login UI
/beads-discover Add password reset
```

### Terminal 2: Agent 2 (Backend Engineer)

```bash
cd /path/to/project
claude

# Claim ready work
/beads-claim
# → Claims "Add JWT service"

# Work on it...
# Discover new tasks as needed
/beads-discover Add token refresh logic

# Complete
/beads-complete
```

### Terminal 3: Agent 3 (Frontend Engineer)

```bash
cd /path/to/project
claude

# Claim different work (no conflicts!)
/beads-claim
# → Claims "Add login UI"

# Work on it...
/beads-complete
```

### All Agents: Sync Periodically

```bash
# In any terminal
/beads-sync

# All agents see same state
# Git keeps everything coordinated
```

## Key Concepts

### 1. Dependency Types

```bash
# BLOCKS: Hard blocker (must complete first)
bd --no-db dep add bd-2 bd-1  # bd-1 blocks bd-2

# RELATED: Soft connection (informational)
bd --no-db dep add --type related bd-3 bd-2

# PARENT-CHILD: Epic/subtask hierarchy
bd --no-db dep add --type parent-child bd-1 bd-4

# DISCOVERED-FROM: Audit trail
bd --no-db dep add --type discovered-from bd-5 bd-2
```

### 2. Agent Workflow

```bash
1. Check ready work:     bd --no-db ready
2. Claim issue:          bd --no-db update bd-X --status in_progress --assignee "me"
3. Work on it:           (implement, code, test)
4. Discover new work:    bd --no-db create "..." --dep-from bd-X
5. Complete:             bd --no-db close bd-X
6. Sync:                 git add .beads/ && git commit && git push
```

### 3. Coordination Patterns

**Sequential Pipeline**:
```
bd-1 → bd-2 → bd-3
(Each blocks the next)

Agent 1: Works on bd-1
Agent 2: Waits for bd-1, then claims bd-2
Agent 3: Waits for bd-2, then claims bd-3
```

**Parallel Execution**:
```
bd-1, bd-2, bd-3
(No dependencies)

Agent 1: Claims bd-1
Agent 2: Claims bd-2
Agent 3: Claims bd-3
All work in parallel
```

**Fan-out Discovery**:
```
bd-1 (Parent)
  ├─ bd-2 (discovered by Agent 1)
  ├─ bd-3 (discovered by Agent 1)
  └─ bd-4 (discovered by Agent 2)

Agent 1: Works on bd-1, discovers bd-2, bd-3
Agent 2: Claims bd-2, discovers bd-4
Agent 3: Claims bd-3
```

## Real-World Example

### Scenario: Build User Authentication

**Agent 1: Architect**
```bash
claude
> bd --no-db create "Epic: User auth" --type epic
> /beads-discover Design architecture
> /beads-discover Implement JWT
> /beads-discover Build login UI
> /beads-discover Add password reset

# Creates 5 issues, sets dependencies
```

**Agent 2: Backend**
```bash
claude
> /beads-claim
# Claims: bd-3 (Implement JWT)

# Works on it, discovers blocker
> /beads-discover Add token refresh mechanism --blocks bd-3

# Switches to blocker
> /beads-claim
# Claims: bd-6 (Token refresh)

# Completes both
> /beads-complete bd-6
> /beads-complete bd-3

# This unblocks bd-4 (Login UI)!
```

**Agent 3: Frontend**
```bash
claude
> /beads-claim
# Initially: No work (bd-4 blocked by bd-3)
# After Agent 2 completes bd-3:
> /beads-claim
# Claims: bd-4 (Login UI)

# Discovers missing API
> /beads-discover Add /api/login endpoint --blocks bd-4

# Waits for Agent 2 to implement API
# Then resumes bd-4
```

## Monitoring

### View Current State

```bash
bd --no-db list --json | jq -r '.[] | "\(.id) [\(.status)] \(.title) @\(.assignee)"'

# Output:
# bd-1 [in_progress] Epic: User auth @claude-agent-1
# bd-2 [completed] Design architecture @claude-agent-1
# bd-3 [completed] Implement JWT @claude-agent-2
# bd-4 [in_progress] Login UI @claude-agent-3
# bd-5 [open] Password reset
```

### View Dependency Tree

```bash
bd --no-db dep tree bd-1

# Output:
# bd-1 (Epic: User auth)
#   ├─ bd-2 (Design) [completed]
#   ├─ bd-3 (JWT service) [completed]
#   │   └─ bd-6 (Token refresh) [completed]
#   ├─ bd-4 (Login UI) [in_progress @agent-3]
#   │   └─ bd-7 (API endpoint) [in_progress @agent-2]
#   └─ bd-5 (Password reset) [open]
```

### Agent Productivity

```bash
bd --no-db list --status completed --json | \
  jq 'group_by(.assignee) | map({agent: .[0].assignee, completed: length})'

# Output:
# [
#   {"agent": "claude-agent-1", "completed": 2},
#   {"agent": "claude-agent-2", "completed": 5},
#   {"agent": "claude-agent-3", "completed": 3}
# ]
```

## Advanced: Agent Specialization

### Create Specialized Agent Roles

**Explorer Agent** (discovers work, doesn't execute):
```bash
# Agent 1: Explorer
claude --model claude-sonnet-4-5
> Analyze the codebase for missing features
> (Creates 10 issues for missing work)
```

**Executor Agent** (claims and executes):
```bash
# Agent 2: Executor
claude --model claude-sonnet-4-5
> /beads-claim
> (Works on the issue)
> /beads-complete
> /beads-claim
> (Repeats)
```

**Reviewer Agent** (reviews completed work):
```bash
# Agent 3: Reviewer
claude --model claude-sonnet-4-5
> Review completed issues for quality
> (Creates follow-up tasks for improvements)
```

## Troubleshooting

### Issue: Two agents claimed same work

**Prevention**:
```bash
# Check assignee before claiming
ISSUE=$(bd --no-db ready --json | jq -r '.[0].id')
ASSIGNEE=$(bd --no-db show $ISSUE --json | jq -r '.assignee // empty')

if [ -z "$ASSIGNEE" ]; then
  bd --no-db update $ISSUE --assignee "me"
else
  echo "Already claimed by $ASSIGNEE"
fi
```

### Issue: Git conflicts in .beads/issues.jsonl

**Resolution**:
```bash
# Beads has custom merge driver
bd --no-db merge .beads/issues.jsonl

# Or use git merge strategy
git checkout --theirs .beads/issues.jsonl
bd --no-db import .beads/issues.jsonl
```

### Issue: Agent can't find ready work

**Debug**:
```bash
# Check why work is blocked
bd --no-db blocked --json | jq -r '.[] | "\(.id): blocked by \(.blocking_ids)"'

# Check in-progress work
bd --no-db list --status in_progress

# Check if all work is completed
bd --no-db list --status open
```

## Architecture Details

See **MULTI_AGENT_BEADS_ARCHITECTURE.md** for:
- Complete architecture diagrams
- All coordination patterns
- Concurrency handling
- Best practices
- Advanced scenarios

## Next Steps

1. **Run the demo**: `./examples/multi-agent-beads-demo.sh`
2. **Try with 2 terminals**: Open two Claude sessions, use `/beads-claim` in each
3. **Build real project**: Create epic, let agents decompose and execute
4. **Customize agents**: Create specialized roles (explorer, executor, reviewer)
5. **Scale up**: Add more agents as needed (3, 5, 10...)

## Performance Tips

- **Sync frequency**: Every 5-10 minutes during long tasks
- **Claim granularity**: Break into 30min-2hr tasks
- **Agent specialization**: Assign agents to domains (backend, frontend, etc.)
- **Priority usage**: Use P0 for blockers, P1 for features, P2+ for polish

## FAQ

**Q: Can agents work on the same file?**
A: Yes, but create issues with file-level granularity to minimize conflicts.

**Q: How many agents can run concurrently?**
A: No hard limit. 3-5 is optimal. Beyond 10, consider separate Beads databases.

**Q: What if an agent goes offline?**
A: No problem. Other agents continue. Offline agent resumes on next sync.

**Q: Can I use different models per agent?**
A: Yes! Use `--model` flag: `claude --model claude-opus-4-5`

**Q: Does this work with LiteLLM/Gemini/OpenAI?**
A: Yes! See OPENAI_IMPLEMENTATION_GUIDE.md for setup.

## Summary

✅ **Multi-agent coordination** via shared Beads database
✅ **Dependency tracking** prevents conflicts and ensures correct order
✅ **Git-backed** storage syncs across all agents
✅ **Slash commands** for easy interaction
✅ **Proven patterns** from Claude Code plugins

**You're ready to orchestrate multiple Claude agents!**

Try it now:
```bash
# Terminal 1
claude
> /beads-claim

# Terminal 2
claude
> /beads-claim

# Watch them coordinate! 🎯
```
