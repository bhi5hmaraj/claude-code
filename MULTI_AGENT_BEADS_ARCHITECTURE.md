# Multi-Agent Orchestration with Beads

## Architecture Overview

Multiple Claude Code instances sharing a single Beads database for coordinated, dependency-aware task execution.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shared Beads Database                     │
│                      (.beads/issues.jsonl)                       │
│                                                                   │
│  Issue Graph:                                                    │
│  ┌──────┐ blocks ┌──────┐ blocks ┌──────┐                       │
│  │ bd-1 │────────▶│ bd-2 │────────▶│ bd-3 │                      │
│  └──────┘         └──────┘         └──────┘                      │
│     │              │   │              │                           │
│     │ parent       │   │ related      │ discovered-from          │
│     ▼              ▼   ▼              ▼                           │
│  ┌──────┐       ┌──────┐          ┌──────┐                      │
│  │ bd-4 │       │ bd-5 │          │ bd-6 │                       │
│  └──────┘       └──────┘          └──────┘                      │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Claude 1 │        │ Claude 2 │        │ Claude 3 │
   │  Agent   │        │  Agent   │        │  Agent   │
   └──────────┘        └──────────┘        └──────────┘
   Claims bd-1         Claims bd-4         Claims bd-5
   (no deps)          (bd-1 parent)       (unblocked)
```

## Core Concepts

### 1. Shared State via Beads

**Beads provides**:
- **Issue tracking** - What work exists
- **Dependency graph** - What blocks what
- **Status tracking** - open, in_progress, completed
- **Git-backed storage** - Auto-sync across instances
- **Atomic operations** - Safe concurrent access

### 2. Four Dependency Types

```bash
# blocks - Hard blocker, must complete first
bd dep add bd-2 bd-1  # bd-1 blocks bd-2

# related - Soft connection, informational
bd dep add --type related bd-3 bd-2

# parent-child - Hierarchical (epic/subtask)
bd dep add --type parent-child bd-1 bd-4

# discovered-from - Audit trail of discovery
bd dep add --type discovered-from bd-5 bd-1
```

### 3. Agent Workflow Pattern

Each Claude agent follows this pattern:

```bash
# 1. Discover ready work
bd ready --json | jq -r '.[0].id'

# 2. Claim issue (set assignee + status)
bd update bd-1 --status in_progress --assignee "agent-1"

# 3. Execute work (read issue details)
bd show bd-1 --json | jq -r '.description'

# 4. Discover new work during execution
bd create "Found: Need to fix tests" -d "Discovered while working on bd-1" --dep-from bd-1

# 5. Mark complete or blocked
bd close bd-1
# OR
bd create "Blocker: Missing API key" -d "Can't proceed without API key" --blocks bd-1
```

## Multi-Agent Patterns

### Pattern 1: Parallel Execution (No Dependencies)

```
Agent 1: Claims bd-1 (UI work)
Agent 2: Claims bd-2 (API work)
Agent 3: Claims bd-3 (Docs work)

All execute in parallel, no conflicts.
```

### Pattern 2: Sequential Pipeline (Blocks)

```
bd-1 (Design) ──blocks──> bd-2 (Implement) ──blocks──> bd-3 (Test)

Agent 1: Completes bd-1
Agent 2: Automatically claims bd-2 (now ready)
Agent 3: Waits for bd-2
```

### Pattern 3: Fan-out Exploration (Discovered-from)

```
Agent 1: Working on bd-1 (Feature X)
Agent 1: Discovers need for bd-2 (API endpoint)
Agent 1: Discovers need for bd-3 (Database migration)
Agent 2: Claims bd-2 (now ready)
Agent 3: Claims bd-3 (now ready)

All bd-2, bd-3 track they came from bd-1
```

### Pattern 4: Epic Decomposition (Parent-child)

```
bd-1 (Epic: User Auth)
  ├─ bd-4 (Login UI)
  ├─ bd-5 (JWT tokens)
  └─ bd-6 (Password reset)

Agent 1: Creates epic bd-1
Agent 2: Claims bd-4
Agent 3: Claims bd-5
Agent 4: Claims bd-6

Track progress: bd show bd-1 --tree
```

## Implementation: Claude Code Integration

### Slash Commands for Beads Orchestration

#### `/beads-claim` - Claim Next Ready Issue

```bash
# Claims the highest priority ready issue
bd ready --json | jq -r '.[0].id' | xargs -I {} bd update {} --status in_progress --assignee "$USER"
```

#### `/beads-discover` - Create Issue from Current Work

```bash
# User provides: "Need to add error handling"
# Creates new issue, links to current work
bd create "Add error handling" -d "Discovered during: <context>" --dep-from <current-issue>
```

#### `/beads-complete` - Mark Current Issue Complete

```bash
# Marks issue complete, shows newly unblocked work
bd close <issue-id>
bd ready --json  # Show what's now available
```

#### `/beads-status` - Show Multi-Agent Status

```bash
# Overview of all agents' work
bd list --status in_progress --json | jq -r '.[] | "\(.id): \(.title) [@\(.assignee)]"'
```

## Example: Multi-Agent Feature Development

### Scenario: Build User Authentication System

**Initial State**: Single epic issue

```bash
bd create "Epic: User authentication system" \
  -d "Complete user auth with login, signup, JWT, password reset" \
  -t epic \
  --priority 0
# Created: bd-1
```

### Agent 1: Architect (Decomposition)

```bash
# Agent 1 reads bd-1, decomposes into tasks
bd create "Design auth architecture" --parent bd-1 --priority 0
bd create "Implement JWT service" --parent bd-1 --priority 1 --blocks bd-3
bd create "Build login UI" --parent bd-1 --priority 1 --blocks bd-4
bd create "Add signup endpoint" --parent bd-1 --priority 1 --blocks bd-5
bd create "Implement password reset" --parent bd-1 --priority 2
# Created: bd-2, bd-3, bd-4, bd-5, bd-6

# Mark bd-1 as decomposed
bd update bd-1 --status in_progress
```

### Agent 2: Backend Engineer

```bash
# Claims JWT service (highest priority ready task)
bd ready --json | jq -r '.[0].id'  # Returns bd-3

bd update bd-3 --status in_progress --assignee "agent-2"

# Works on bd-3, discovers need for token refresh
bd create "Add token refresh logic" \
  -d "JWT needs refresh mechanism" \
  --dep-from bd-3 \
  --priority 1

# Completes bd-3
bd close bd-3 --reason "Implemented JWTService with tests"

# bd-4 (login UI) is now unblocked!
```

### Agent 3: Frontend Engineer

```bash
# Claims login UI (now unblocked)
bd ready --json | jq -r '.[0].id'  # Returns bd-4

bd update bd-4 --status in_progress --assignee "agent-3"

# Discovers missing API endpoint
bd create "Add /api/auth/login endpoint" \
  -d "Login UI needs backend endpoint" \
  --blocks bd-4 \
  --dep-from bd-4 \
  --priority 0

# Blocks self, creates blocker issue
bd update bd-4 --status open  # Unassign, wait for blocker
```

### Agent 4: API Developer

```bash
# Sees new blocker, claims it
bd ready --json | jq -r '.[0].id'  # Returns bd-8 (API endpoint)

bd update bd-8 --status in_progress --assignee "agent-4"

# Implements endpoint
bd close bd-8

# bd-4 is now unblocked, Agent 3 can resume
```

### Agent 3: Resumes Login UI

```bash
# bd-4 is ready again
bd update bd-4 --status in_progress --assignee "agent-3"

# Completes
bd close bd-4
```

### Final State

```bash
bd show bd-1 --tree --json

# Output:
bd-1 (Epic: User auth) [in_progress]
  ├─ bd-2 (Design auth architecture) [completed]
  ├─ bd-3 (Implement JWT service) [completed]
  │   └─ bd-7 (Add token refresh logic) [completed]
  ├─ bd-4 (Build login UI) [completed]
  │   └─ bd-8 (Add /api/auth/login endpoint) [completed]
  ├─ bd-5 (Add signup endpoint) [in_progress] [@agent-2]
  └─ bd-6 (Implement password reset) [open]
```

## Agent Communication Protocol

### 1. Issue Creation (Discovery)

When an agent discovers new work:

```bash
bd create "<title>" \
  -d "Discovered by: <agent-name>\nContext: <current-issue>\nReason: <why-needed>" \
  --dep-from <current-issue> \
  --priority <0-4> \
  --type <bug|feature|task> \
  --assignee <suggest-assignee>  # Optional
```

### 2. Claiming Work (Atomicity)

```bash
# Atomic claim (check + update)
ISSUE=$(bd ready --json | jq -r 'select(length > 0) | .[0].id')
if [ -n "$ISSUE" ]; then
  bd update $ISSUE --status in_progress --assignee "$AGENT_NAME"
  echo "Claimed: $ISSUE"
else
  echo "No ready work"
fi
```

### 3. Status Updates (Progress)

```bash
# Regular progress updates
bd comment $ISSUE "Progress: Implemented authentication logic, writing tests..."

# Add labels for categorization
bd label add $ISSUE "backend" "high-priority" "security"
```

### 4. Completion (Handoff)

```bash
# Close with summary
bd close $ISSUE --reason "Completed: <summary>\nFiles: <files>\nTests: <test-status>"

# Show what's now unblocked
bd list --status open --json | jq -r '.[] | select(.dependency_count == 0) | "\(.id): \(.title)"'
```

## Concurrency & Conflicts

### Safe Concurrent Operations

**Beads handles**:
- ✅ Multiple agents reading issues
- ✅ Multiple agents creating issues
- ✅ Different agents working on different issues
- ✅ Git merge conflicts (custom merge driver)

### Potential Conflicts

**Watch out for**:
- ⚠️ Two agents claiming same issue simultaneously
- ⚠️ Race condition on `bd ready` → `bd update`
- ⚠️ Git push conflicts on `.beads/issues.jsonl`

### Conflict Resolution

```bash
# Use assignee check before claiming
ISSUE=$(bd ready --json | jq -r '.[0].id')
CURRENT_ASSIGNEE=$(bd show $ISSUE --json | jq -r '.assignee // empty')

if [ -z "$CURRENT_ASSIGNEE" ]; then
  bd update $ISSUE --assignee "$AGENT_NAME"
  echo "Claimed successfully"
else
  echo "Already claimed by $CURRENT_ASSIGNEE"
fi
```

## Monitoring & Observability

### Dashboard View

```bash
# Create /beads-dashboard slash command
bd list --json | jq '
  group_by(.status) |
  map({status: .[0].status, count: length, issues: map(.id)}) |
  .[]
'

# Output:
# {status: "open", count: 5, issues: ["bd-1", "bd-6", ...]}
# {status: "in_progress", count: 3, issues: ["bd-4", "bd-5", "bd-8"]}
# {status: "completed", count: 7, issues: ["bd-2", "bd-3", ...]}
```

### Agent Activity

```bash
# Which agent is doing what?
bd list --status in_progress --json | jq -r '.[] | "[\(.assignee)] \(.id): \(.title)"'

# Output:
# [agent-1] bd-4: Build login UI
# [agent-2] bd-5: Add signup endpoint
# [agent-3] bd-9: Write integration tests
```

### Dependency Visualization

```bash
# Show full dependency graph
bd dep tree --all | head -50

# Critical path analysis
bd list --priority 0 --status open --json | jq -r '.[] | "\(.id): \(.title) (blocks: \(.dependent_count) issues)"'
```

## Git Workflow Integration

### Auto-Sync Pattern

Beads automatically syncs via git:

```bash
# Agent 1: Creates issues
bd create "Task 1"  # Auto-exports to issues.jsonl after 5s

# Agent 1: Git commit + push
git add .beads/issues.jsonl
git commit -m "Agent 1: Created tasks"
git push

# Agent 2: Git pull
git pull  # Beads auto-imports newer JSONL

# Agent 2: Sees new tasks
bd ready  # Shows tasks created by Agent 1
```

### Manual Sync (Immediate)

```bash
# Force immediate export
bd export > .beads/issues.jsonl

# Force immediate import
bd import .beads/issues.jsonl

# Full sync cycle
bd export > .beads/issues.jsonl && \
git add .beads/issues.jsonl && \
git commit -m "Sync beads state" && \
git push && \
git pull && \
bd import .beads/issues.jsonl
```

## Best Practices

### 1. Issue Naming Conventions

```bash
# Prefix with category
bd create "[Backend] Add authentication API"
bd create "[Frontend] Build login form"
bd create "[Infra] Setup CI/CD pipeline"
bd create "[Docs] API documentation"
```

### 2. Priority Assignment

```bash
# 0 = Critical (blocks everything)
# 1 = High (core features)
# 2 = Medium (nice-to-have)
# 3 = Low (polish)
# 4 = Backlog (maybe someday)
```

### 3. Dependency Guidelines

```bash
# Use 'blocks' sparingly - only for hard blockers
bd dep add bd-2 bd-1  # bd-1 MUST complete first

# Use 'related' for loose connections
bd dep add --type related bd-3 bd-2  # Share context, but independent

# Use 'parent-child' for epics
bd dep add --type parent-child bd-1 bd-4  # bd-4 is subtask of bd-1

# Use 'discovered-from' for audit trail
bd dep add --type discovered-from bd-5 bd-2  # Track where work came from
```

### 4. Assignee Strategy

```bash
# Human assignees: @username
bd update bd-1 --assignee "@alice"

# Agent assignees: agent-role
bd update bd-2 --assignee "agent-backend"
bd update bd-3 --assignee "agent-frontend"
bd update bd-4 --assignee "agent-reviewer"

# Suggested assignee (not claimed yet)
bd create "Task" --assignee "suggest:@bob"
```

## Advanced: Custom Agent Roles

### Specialized Agent Types

#### Explorer Agent
```bash
# Discovers work, creates issues, doesn't claim
ROLE="explorer"

bd create "[Explorer] Found: Missing error handling" \
  --dep-from bd-1 \
  --assignee "suggest:agent-backend"
```

#### Executor Agent
```bash
# Claims and executes work
ROLE="executor"

ISSUE=$(bd ready --json | jq -r '.[0].id')
bd update $ISSUE --assignee "agent-executor-1" --status in_progress
# ... do work ...
bd close $ISSUE
```

#### Reviewer Agent
```bash
# Reviews completed work, creates follow-ups
ROLE="reviewer"

COMPLETED=$(bd list --status completed --json | jq -r '.[0].id')
bd create "[Review] Add tests for $COMPLETED" \
  --dep-from $COMPLETED \
  --type task
```

#### Coordinator Agent
```bash
# Creates epics, decomposes, assigns priorities
ROLE="coordinator"

bd create "Epic: User auth" --type epic --priority 0
EPIC=$(bd list --type epic --json | jq -r '.[0].id')

bd create "Subtask 1" --parent $EPIC --assignee "suggest:agent-backend"
bd create "Subtask 2" --parent $EPIC --assignee "suggest:agent-frontend"
```

## Implementation Checklist

- [ ] Install Beads (`bd init --no-db`)
- [ ] Create slash commands (`/beads-claim`, `/beads-discover`, etc.)
- [ ] Define agent roles (explorer, executor, reviewer, coordinator)
- [ ] Setup git hooks for auto-sync
- [ ] Create monitoring dashboard
- [ ] Test concurrent agent execution
- [ ] Document team workflows

## Next Steps

1. **Create slash commands** - Integrate Beads into Claude Code workflows
2. **Define agent personas** - Specialized agents with clear roles
3. **Build orchestration layer** - Master agent that coordinates others
4. **Setup monitoring** - Real-time view of multi-agent activity
5. **Production testing** - Real-world multi-agent scenarios

---

**Built on**: Beads v0.23.1 by Steve Yegge
**Repository**: https://github.com/steveyegge/beads
**Claude Code**: v2.0.34
