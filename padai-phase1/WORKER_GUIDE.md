# PadAI Worker Agent Guide

This guide is for Claude Code agents working on tasks coordinated by the PadAI master server.

## Quick Start

The PadAI master server coordinates work across multiple agents. You communicate with it using simple HTTP requests.

### Master Server URL

```bash
# Set this in your environment or use directly
export PADAI_MASTER="http://your-padai-server.railway.app"
# Or for local testing
export PADAI_MASTER="http://localhost:8000"
```

### Your Agent Name

Choose a unique name for yourself:
```bash
export AGENT_NAME="claude-agent-$(date +%s)"
# Or use a descriptive name
export AGENT_NAME="frontend-specialist"
```

## Worker Workflow

### 1. Check What's Available

See what tasks are ready to claim:

```bash
curl -s $PADAI_MASTER/api/ready | jq '.tasks'
```

Response:
```json
{
  "tasks": [
    {
      "id": "padai-4",
      "title": "GET /api/status endpoint",
      "status": "ready"
    }
  ]
}
```

### 2. Claim a Task

Claim the next available task:

```bash
TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\": \"$AGENT_NAME\"}")

echo $TASK | jq
```

Response:
```json
{
  "task": {
    "id": "padai-4",
    "title": "GET /api/status endpoint",
    "status": "in_progress",
    "assignee": "claude-agent-123",
    "dependencies": [...]
  }
}
```

Extract task details:
```bash
TASK_ID=$(echo $TASK | jq -r '.task.id')
TASK_TITLE=$(echo $TASK | jq -r '.task.title')

echo "📋 Working on: $TASK_ID - $TASK_TITLE"
```

### 3. Do the Work

Implement the task according to its description. Read the task details, implement the feature, test it, and commit your changes.

```bash
# Example workflow
echo "Implementing: $TASK_TITLE"

# Read task details
echo $TASK | jq '.task'

# Do your work here...
# - Read relevant files
# - Make changes
# - Test
# - Commit
```

### 4. Mark as Complete

When done, mark the task as completed:

```bash
curl -s -X POST $PADAI_MASTER/api/complete \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}" | jq

echo "✅ Task $TASK_ID completed!"
```

### 5. Repeat

Loop back to step 1 to claim the next task.

## Full Example Script

```bash
#!/bin/bash
# worker-loop.sh - Continuous worker agent

set -e

PADAI_MASTER="${PADAI_MASTER:-http://localhost:8000}"
AGENT_NAME="${AGENT_NAME:-claude-worker-$$}"

echo "🤖 Agent: $AGENT_NAME"
echo "🌐 Master: $PADAI_MASTER"
echo ""

while true; do
  echo "🔍 Checking for available tasks..."

  # Check if any tasks are ready
  READY_COUNT=$(curl -s $PADAI_MASTER/api/status | jq -r '.ready')

  if [ "$READY_COUNT" -eq 0 ]; then
    echo "⏸️  No tasks ready. Waiting 30s..."
    sleep 30
    continue
  fi

  echo "📋 $READY_COUNT tasks available. Claiming one..."

  # Claim next task
  TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
    -H "Content-Type: application/json" \
    -d "{\"agent_name\": \"$AGENT_NAME\"}")

  TASK_ID=$(echo $TASK | jq -r '.task.id')
  TASK_TITLE=$(echo $TASK | jq -r '.task.title')

  if [ "$TASK_ID" = "null" ]; then
    echo "❌ Failed to claim task. Retrying..."
    sleep 10
    continue
  fi

  echo "✅ Claimed: $TASK_ID - $TASK_TITLE"
  echo ""
  echo "Task details:"
  echo $TASK | jq '.task'
  echo ""

  # TODO: Implement the task here
  # For now, just simulate work
  echo "⚙️  Working on task..."
  sleep 5

  # Mark as complete
  echo "Completing task $TASK_ID..."
  curl -s -X POST $PADAI_MASTER/api/complete \
    -H "Content-Type: application/json" \
    -d "{\"task_id\": \"$TASK_ID\"}" | jq

  echo "✅ Task $TASK_ID completed!"
  echo ""
  echo "---"
  echo ""
done
```

## API Reference

### GET /api/status

Get project statistics.

```bash
curl $PADAI_MASTER/api/status
```

Response:
```json
{
  "total": 18,
  "ready": 5,
  "in_progress": 2,
  "completed": 11
}
```

### GET /api/ready

List tasks ready to claim.

```bash
curl $PADAI_MASTER/api/ready
```

### GET /api/tasks

Get all tasks with dependencies (useful for understanding the full project).

```bash
curl $PADAI_MASTER/api/tasks
```

### POST /api/claim

Claim a task. Returns the full task object with dependencies.

```bash
curl -X POST $PADAI_MASTER/api/claim \
  -H "Content-Type: application/json" \
  -d '{"agent_name": "your-agent-name"}'
```

### POST /api/complete

Mark a task as completed.

```bash
curl -X POST $PADAI_MASTER/api/complete \
  -H "Content-Type: application/json" \
  -d '{"task_id": "padai-4"}'
```

## Tips for Claude Code Agents

### Understanding Your Task

When you claim a task, examine:
- `task.title` - What needs to be done
- `task.description` - Additional details
- `task.dependencies` - What other tasks this depends on

### Coordination

- Only claim tasks when you're ready to work on them
- If you get stuck, you can abandon a task (manually update via bd CLI)
- Check dependencies - don't start work that's blocked

### Best Practices

1. **Always claim before starting** - Don't just pick a task from the ready list
2. **Complete atomically** - Only mark complete when fully done and tested
3. **Commit your work** - Make git commits for each completed task
4. **Communicate** - (Phase 2 will add Telegram/Agent Mail for this)

## Troubleshooting

### No tasks available

```bash
# Check project status
curl $PADAI_MASTER/api/status

# See all tasks and their states
curl $PADAI_MASTER/api/tasks | jq '.tasks[] | {id, title, status}'
```

### Task claim failed

If you get a 404 when claiming, all ready tasks were just claimed by other agents. Wait and retry.

### Can't reach master server

```bash
# Test connectivity
curl $PADAI_MASTER/

# Should return: {"status":"ok","service":"PadAI Master Server"}
```

## Phase 2 Features (Coming Soon)

- **Remote MCP** - Use MCP tools instead of curl
- **Agent Mail** - Send messages to other agents
- **WebSocket** - Real-time task updates
- **Telegram Bot** - Human oversight and coordination

## Example: Claude Code Usage

As a Claude Code agent, you can use these commands directly:

```bash
# In your conversation
export PADAI_MASTER="http://your-server.railway.app"
export AGENT_NAME="claude-$(hostname)"

# Claim next task
TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\": \"$AGENT_NAME\"}")

# Extract task ID
TASK_ID=$(echo $TASK | jq -r '.task.id')
echo "Working on: $TASK_ID"

# Do the work...

# Complete when done
curl -s -X POST $PADAI_MASTER/api/complete \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}"
```
