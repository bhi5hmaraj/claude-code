# PadAI Worker Instructions

You are a worker agent in a multi-agent PadAI project. Your job is to claim tasks from the master server, complete them, and mark them as done.

## Setup

First, set these environment variables:

```bash
export PADAI_MASTER="{{PADAI_MASTER_URL}}"
export AGENT_NAME="{{YOUR_AGENT_NAME}}"
```

Replace:
- `{{PADAI_MASTER_URL}}` with the PadAI master server URL (e.g., `http://padai.railway.app`)
- `{{YOUR_AGENT_NAME}}` with a unique name (e.g., `frontend-specialist`, `backend-dev`)

## Workflow

### 1. Check available tasks

```bash
curl -s $PADAI_MASTER/api/ready | jq '.tasks'
```

### 2. Claim next task

```bash
TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\": \"$AGENT_NAME\"}")

TASK_ID=$(echo $TASK | jq -r '.task.id')
TASK_TITLE=$(echo $TASK | jq -r '.task.title')

echo "Working on: $TASK_ID - $TASK_TITLE"
```

### 3. Read task details

```bash
echo $TASK | jq '.task'
```

This shows:
- `id` - Task identifier
- `title` - What to do
- `description` - Additional details
- `dependencies` - What this task depends on

### 4. Implement the task

Do your work:
- Read relevant files
- Make changes
- Test your implementation
- Commit your code

### 5. Mark as complete

When finished:

```bash
curl -s -X POST $PADAI_MASTER/api/complete \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}" | jq

echo "Task $TASK_ID completed!"
```

### 6. Repeat

Go back to step 1 and claim the next task.

## Full Example

```bash
# Setup (once)
export PADAI_MASTER="http://localhost:8000"
export AGENT_NAME="claude-agent-$(date +%s)"

# Claim task
TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\": \"$AGENT_NAME\"}")

TASK_ID=$(echo $TASK | jq -r '.task.id')
echo "Working on: $TASK_ID"

# Show task details
echo $TASK | jq '.task | {id, title, description}'

# Do the work...
# (implement the task)

# Mark complete
curl -s -X POST $PADAI_MASTER/api/complete \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}"
```

## Important Notes

1. **Only claim when ready** - Don't claim tasks you can't immediately work on
2. **Complete atomically** - Only mark complete when fully done and tested
3. **Check dependencies** - Review `task.dependencies` to understand blockers
4. **Commit your work** - Make git commits for completed tasks

## Troubleshooting

**No tasks available:**
```bash
curl -s $PADAI_MASTER/api/status
```

**Can't reach server:**
```bash
curl $PADAI_MASTER/
# Should return: {"status":"ok","service":"PadAI Master Server"}
```

**Task already claimed:**
If you get a 404 when claiming, another agent just claimed the last task. Wait and retry.

## More Information

See `WORKER_GUIDE.md` for the complete guide with advanced workflows and continuous worker loops.
