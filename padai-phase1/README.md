# PadAI - Multi-Agent Orchestration Server

Phase 1 MVP: FastAPI server with React Flow visualization for coordinating multiple Claude Code agents using Beads.

## Architecture

```
┌─────────────────┐
│  React Frontend │  ← React Flow dependency graph visualization
│   (Port 3000)   │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│ FastAPI Server  │  ← /api/status, /api/claim, /api/complete
│   (Port 8000)   │
└────────┬────────┘
         │
         │ bd CLI (--no-db)
         │
┌────────▼────────┐
│ .beads/         │  ← Shared task database (JSONL)
│ issues.jsonl    │
└─────────────────┘
         │
         │ curl commands
         │
┌────────▼────────┐
│ Claude Agents   │  ← Multiple agents coordinate via HTTP
└─────────────────┘
```

## Quick Start

### 1. Install bd CLI

```bash
# Download latest bd release
curl -L https://github.com/steveyegge/beads/releases/latest/download/bd-linux -o /usr/local/bin/bd
chmod +x /usr/local/bin/bd
```

### 2. Start Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Server runs on http://localhost:8000

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs on http://localhost:3000

### 4. Initialize Beads Project

```bash
# In your workspace directory
bd init
bd create "Task 1" --status ready
bd create "Task 2" --status ready
bd dep add task-2 task-1 --type blocks
```

## API Endpoints

### GET /api/status

Get project statistics.

```bash
curl http://localhost:8000/api/status
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

Get tasks ready to be claimed.

```bash
curl http://localhost:8000/api/ready
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

### GET /api/tasks

Get all tasks with dependencies (for visualization).

```bash
curl http://localhost:8000/api/tasks
```

Response:
```json
{
  "tasks": [
    {
      "id": "padai-1",
      "title": "Design PadAI architecture",
      "status": "completed",
      "dependencies": []
    },
    {
      "id": "padai-2",
      "title": "Create server structure",
      "status": "in_progress",
      "assignee": "agent-1",
      "dependencies": [
        {
          "issue_id": "padai-2",
          "depends_on_id": "padai-1",
          "type": "blocks"
        }
      ]
    }
  ]
}
```

### POST /api/claim

Claim next available task for an agent.

```bash
curl -X POST http://localhost:8000/api/claim \
  -H "Content-Type: application/json" \
  -d '{"agent_name": "agent-1"}'
```

Response:
```json
{
  "task": {
    "id": "padai-4",
    "title": "GET /api/status endpoint",
    "status": "in_progress",
    "assignee": "agent-1"
  }
}
```

### POST /api/complete

Mark a task as completed.

```bash
curl -X POST http://localhost:8000/api/complete \
  -H "Content-Type: application/json" \
  -d '{"task_id": "padai-4"}'
```

Response:
```json
{
  "success": true,
  "task_id": "padai-4"
}
```

## 🤖 For Worker Agents

If you're a Claude Code agent joining this project, see **[WORKER_GUIDE.md](WORKER_GUIDE.md)** for complete instructions.

### Quick Start for Workers

Set environment variables:
```bash
export PADAI_MASTER="http://your-server.railway.app"
export AGENT_NAME="claude-worker-$(date +%s)"
```

Claim and complete a task:
```bash
# Claim next available task
TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
  -H "Content-Type: application/json" \
  -d "{\"agent_name\": \"$AGENT_NAME\"}")

TASK_ID=$(echo $TASK | jq -r '.task.id')
echo "📋 Working on: $TASK_ID - $(echo $TASK | jq -r '.task.title')"

# Do your work here...

# Mark as complete
curl -s -X POST $PADAI_MASTER/api/complete \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}"

echo "✅ Task completed!"
```

### Example Agent Workflow Script

See `test-agent.sh` for a complete example:

```bash
#!/bin/bash
# Continuous worker loop

PADAI_MASTER="${PADAI_MASTER:-http://localhost:8000}"
AGENT_NAME="${AGENT_NAME:-worker-$$}"

while true; do
  # Check for ready tasks
  READY=$(curl -s $PADAI_MASTER/api/status | jq -r '.ready')

  if [ "$READY" -eq 0 ]; then
    echo "⏸️  No tasks ready, waiting..."
    sleep 30
    continue
  fi

  # Claim task
  TASK=$(curl -s -X POST $PADAI_MASTER/api/claim \
    -H "Content-Type: application/json" \
    -d "{\"agent_name\": \"$AGENT_NAME\"}")

  TASK_ID=$(echo $TASK | jq -r '.task.id')

  # TODO: Implement the task
  echo "⚙️  Working on $TASK_ID..."

  # Complete task
  curl -s -X POST $PADAI_MASTER/api/complete \
    -H "Content-Type: application/json" \
    -d "{\"task_id\": \"$TASK_ID\"}"
done
```

## Environment Variables

- `WORKSPACE_PATH`: Path to directory containing `.beads/` folder (default: `/workspace`)
- `VITE_API_URL`: API URL for frontend (default: `http://localhost:8000`)

## Deployment

### Railway

1. Create `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "python main.py",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

2. Deploy:

```bash
railway up
```

### Docker

```bash
# Build
docker build -t padai-server .

# Run
docker run -p 8000:8000 \
  -v /path/to/workspace:/workspace \
  padai-server
```

## Phase 2 Roadmap

Future enhancements (not in Phase 1):

- [ ] Remote MCP instead of curl
- [ ] Agent Mail for inter-agent communication
- [ ] Integration with beads-mcp tools
- [ ] WebSocket for real-time updates
- [ ] Telegram bot integration
- [ ] Authentication & multi-tenancy

## License

MIT
