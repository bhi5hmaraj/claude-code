# PadAI Master Server

Lightweight Express API that wraps `bd` CLI to enable multi-agent coordination.

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

## API Endpoints

### GET /health
Health check endpoint

### GET /api/status
Returns current Beads task status (wraps `bd status --json`)

### POST /api/claim
Claims next ready task for an agent
```json
{
  "agentName": "architect"
}
```

### POST /api/complete
Marks task as completed
```json
{
  "taskId": "padai-2",
  "notes": "Server initialization complete"
}
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `BEADS_PATH` - Path to project with `.beads/` folder (default: current directory)

## Development

The server wraps the `bd` CLI using Node's `child_process.spawn()`. Make sure `bd` is installed and in your PATH.
