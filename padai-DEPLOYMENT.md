# PadAI Deployment Guide

## Option 1: Railway (Recommended - 5 minutes)

Railway provides free hosting perfect for PadAI MVP.

### Steps:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `PadAI` repository
   - Railway auto-detects `server/Dockerfile` and deploys!

3. **Get your URL**
   - Railway provides: `https://padai-production.up.railway.app`
   - Test: `curl https://padai-production.up.railway.app/health`

4. **Configure workspace** (Important!)
   - In Railway dashboard, go to Variables
   - Add: `WORKSPACE_PATH=/app/workspace`
   - Upload your `.beads/` folder to Railway (or clone your project repo)

### Cost
- Free tier: 512MB RAM, $5 credit/month
- Sufficient for personal use

---

## Option 2: Local Development

### Prerequisites
- Node.js 18+
- `bd` CLI installed and in PATH

### Run locally:

```bash
cd server

# Install dependencies
npm install

# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Server runs on `http://localhost:3000`

### Test endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Get task status
curl http://localhost:3000/api/status

# Claim a task
curl -X POST http://localhost:3000/api/claim \
  -H "Content-Type: application/json" \
  -d '{"agentName": "test-agent"}'

# Complete a task
curl -X POST http://localhost:3000/api/complete \
  -H "Content-Type: application/json" \
  -d '{"taskId": "padai-2", "notes": "Done!"}'
```

---

## Option 3: Docker

### Build and run:

```bash
cd server

# Build image
docker build -t padai-master .

# Run container
docker run -p 3000:3000 \
  -v $(pwd)/../.beads:/app/.beads:ro \
  padai-master
```

### Or use docker-compose:

```bash
cd server
docker-compose up -d
```

---

## Option 4: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch (from server/ directory)
flyctl launch

# Deploy
flyctl deploy
```

Free tier: 3 shared VMs, auto-scaling

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `WORKSPACE_PATH` | Path to project with .beads/ | Current directory |
| `NODE_ENV` | Environment (development/production) | development |

---

## Troubleshooting

### "bd: command not found"
Install bd CLI:
```bash
curl -L https://github.com/steveyegge/beads/releases/download/v0.1.0/bd-linux-amd64 \
  -o /usr/local/bin/bd
chmod +x /usr/local/bin/bd
```

### "No beads database found"
Make sure `.beads/` folder exists in WORKSPACE_PATH:
```bash
cd /path/to/your/project
ls .beads/issues.jsonl  # Should exist
```

### CORS errors from dashboard
Server has CORS enabled by default. If issues persist, check browser console and verify the server URL.

---

## Next Steps

Once deployed:
1. Update dashboard to poll your server URL
2. Create worker slash commands pointing to your endpoint
3. Test with 2-3 agents claiming tasks
4. Monitor via Railway logs or `docker logs`
