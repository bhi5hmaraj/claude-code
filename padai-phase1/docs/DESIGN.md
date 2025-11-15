# PadAI Design Document

**PadAI** (படை - "army" in Tamil): Multi-agent orchestration system for coordinating Claude Code agents via Beads task management.

## Problem Statement

When building complex software with multiple Claude Code agents working in parallel, we need a way to coordinate their work without conflicts. Each agent runs in a separate cloud session and needs to know what tasks are available, claim work, and report completion. The existing Beads CLI (`bd`) works great for single-agent workflows but has no built-in support for multi-agent coordination.

## Core Value Proposition

Enable multiple Claude Code agents (running in separate Anthropic cloud environments) to:
- Claim tasks from a shared Beads task graph without conflicts
- Update task status atomically
- Visualize progress in real-time via a web dashboard

## Architecture (MVP)

### The 80/20 Approach

We're building the **thinnest possible glue layer** between existing tools that already work. No custom state management, no complex distributed systems, no reinventing Beads.

```
┌─────────────────────────────────────┐
│  PadAI Dashboard (React + Vite)     │
│  • Upload .jsonl or poll server     │
│  • React Flow visualization         │
│  • Status filters, search           │
└─────────────────────────────────────┘
         ↓ HTTP GET /status (polls every 5s)

┌─────────────────────────────────────┐
│  PadAI Master Server (Express)      │
│  • Thin wrapper around bd CLI       │
│  • 3 endpoints: /status, /claim,    │
│    /complete                        │
│  • Single .beads/ folder (SSOT)     │
└─────────────────────────────────────┘
         ↑ HTTP POST /claim
         ↑ HTTP POST /complete
         │
    ┌────┴─────┬─────────┬─────────┐
    │          │         │         │
┌───┴───┐  ┌──┴──┐  ┌──┴──┐  ┌──┴──┐
│Agent 1│  │Ag 2 │  │Ag 3 │  │Ag N │
│Claude │  │Code │  │Web  │  │ ... │
└───────┘  └─────┘  └─────┘  └─────┘
```

### Components

#### 1. Master Server (~50 lines)

**Location:** `server/src/index.ts`

**Responsibilities:**
- Wrap `bd` CLI commands in HTTP endpoints
- Maintain single `.beads/` folder as source of truth
- Handle concurrent updates atomically (bd CLI already does this via file locking)

**API:**

```typescript
GET  /api/status
  → Returns: bd status --json output

POST /api/claim
  Body: { agentName: string }
  → Runs: bd ready --json
  → Takes first task, runs: bd update [id] --status in_progress --assignee [agentName]
  → Returns: claimed task object

POST /api/complete
  Body: { taskId: string, notes?: string }
  → Runs: bd update [taskId] --status completed --notes [notes]
  → Returns: { success: true }
```

**Why this works:**
- `bd` CLI already handles concurrent file access
- No need to reimplement Beads logic
- No database, no state management
- Literally just shelling out to an existing tool

#### 2. Dashboard (existing)

**Location:** `src/` (existing React app)

**Changes needed:**
- Add polling: `setInterval(() => fetch('/api/status'), 5000)`
- Parse response and update graph
- That's it

**Not needed for MVP:**
- WebSocket (polling is fine for personal use)
- Real-time animations
- Agent heartbeats

#### 3. Worker Agents

**No MCP server needed for MVP.** Workers use Claude's existing Bash tool:

```bash
# Claim task
TASK=$(curl -X POST https://padai.up.railway.app/api/claim \
  -H "Content-Type: application/json" \
  -d '{"agentName": "architect"}')

# Do work...

# Mark complete
curl -X POST https://padai.up.railway.app/api/complete \
  -H "Content-Type: application/json" \
  -d '{"taskId": "claude-24", "notes": "Server setup complete"}'
```

Simple, works today, no additional tooling.

## Deployment

### Railway (Recommended for MVP)

**Why Railway:**
- Push to GitHub, auto-deploy
- Free tier sufficient for personal use
- Supports custom binaries (bd CLI)
- Gets you a public URL immediately

**Setup:**

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install bd CLI
RUN apk add --no-cache curl
RUN curl -L https://github.com/steveyegge/beads/releases/download/v0.1.0/bd-linux-amd64 \
    -o /usr/local/bin/bd && chmod +x /usr/local/bin/bd

WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .

EXPOSE 3000
CMD ["node", "src/index.js"]
```

Steps:
1. Push PadAI to GitHub
2. Connect Railway to repo
3. Railway auto-detects Dockerfile and deploys
4. Get URL: `padai-production.up.railway.app`

**Cost:** $0 (free tier)

## What We're NOT Building (Yet)

These are intentionally deferred until we've validated the core concept:

- **WebSocket real-time updates** - Polling works fine for MVP. Add later if it's actually painful.
- **MCP server for workers** - Bash + curl works. Build MCP if workflow feels clunky after using it.
- **Telegram notifications** - Can add in 20 lines once we know what events matter.
- **Agent registry / heartbeats** - Not needed until agents start disappearing and we need monitoring.
- **Authentication** - Personal project, no sensitive data. Add if deploying publicly.
- **Horizontal scaling** - One server handles this easily. Cross that bridge if we hit it.

## Success Metrics

MVP is successful if:
1. 3+ Claude agents can simultaneously claim different tasks without conflicts
2. Dashboard updates within 5 seconds of task status changes
3. We can build a real project (e.g., multiplayer Pac-Man) using this system
4. Total setup time from git clone to working: < 30 minutes

## Development Phases

### ✅ Phase 1: Simple MVP (COMPLETED)

**Goal:** Validate the concept with the simplest possible implementation.

**What we built:**
- **Backend:** FastAPI server (Python) wrapping bd CLI
  - `beads.py` - Python wrapper for bd CLI operations
  - `main.py` - FastAPI server with 5 HTTP endpoints
  - Endpoints: `/api/status`, `/api/ready`, `/api/tasks`, `/api/claim`, `/api/complete`
  - Uses `bd --no-db` mode for JSONL-only operation

- **Frontend:** React + TypeScript + Vite
  - React Flow visualization with Dagre layout
  - Real-time polling (5 second interval)
  - Dark theme UI with status color coding
  - Mini-map and controls for navigation

- **Worker Integration:** Simple curl commands
  - `WORKER_GUIDE.md` - Complete guide for worker agents
  - `test-agent.sh` - Bash script for testing workflows
  - No MCP needed - just HTTP + curl

- **Deployment:** Docker + Railway ready
  - `Dockerfile` - Multi-stage build with bd CLI
  - `railway.json` - One-click deployment config

**Stack choices:**
- Python instead of Express (better alignment with beads-mcp for Phase 2)
- FastAPI for async + automatic docs
- React Flow for dependency graph visualization

**Status:** ✅ Tested and working
- Task claim/complete workflow verified
- Dependency graph visualization working
- Ready for multi-agent testing

**Time spent:** ~4 hours

### 🔄 Phase 2: Explore beads-mcp Integration (PLANNED)

**Goal:** Investigate if we can leverage existing beads-mcp infrastructure instead of building from scratch.

**Background:**
The Beads ecosystem already has `beads-mcp` (https://github.com/steveyegge/beads/tree/main/integrations/beads-mcp), which provides:
- FastMCP server wrapping bd CLI with ~20 tool functions
- Agent Mail for inter-agent HTTP messaging
- Persistent context storage across MCP requests
- Remote access via Streamable HTTP transport

**Key question:** Can we extend/reuse beads-mcp instead of maintaining parallel infrastructure?

**Investigation tasks:**

1. **Understand beads-mcp architecture**
   - How does Agent Mail work?
   - What's the daemon doing?
   - Can we use remote MCP transport for workers?
   - Read: `/beads/integrations/beads-mcp/src/beads_mcp/`

2. **Compare approaches:**
   ```
   Current (Phase 1):     Proposed (Phase 2):
   ┌─────────────┐        ┌─────────────┐
   │ PadAI HTTP  │        │ beads-mcp   │
   │ FastAPI     │   vs   │ FastMCP     │
   │ bd CLI      │        │ bd tools    │
   └─────────────┘        └─────────────┘
   ```

3. **Evaluate options:**

   **Option A: Extend beads-mcp**
   - Fork/PR to add multi-agent coordination
   - Add HTTP endpoints on top of MCP
   - Pros: Leverage existing tools, stay in sync with Beads
   - Cons: Coupling to beads-mcp development

   **Option B: Import beads-mcp tools**
   - Keep PadAI FastAPI server
   - Import `from beads_mcp.tools import *`
   - Add thin HTTP layer on top
   - Pros: Reuse battle-tested code, control our API
   - Cons: Still some duplication

   **Option C: Remote MCP wrapper**
   - Run beads-mcp as remote MCP server
   - PadAI becomes HTTP→MCP proxy
   - Workers use native MCP protocol
   - Pros: Clean separation, MCP native
   - Cons: Extra abstraction layer

4. **MCP for workers (instead of curl)**
   - Expose PadAI as remote MCP server
   - Workers use MCP tools: `mcp__padai__claim_task`, `mcp__padai__complete_task`
   - Much cleaner than curl in agent workflows
   - FastMCP makes this trivial to add

5. **Agent Mail integration**
   - Investigate beads-mcp Agent Mail for inter-agent messaging
   - Could replace Telegram bot idea
   - HTTP-based, simple protocol

**Deliverables:**
- Decision document: Which option to pursue
- POC implementation if Option B/C chosen
- Updated worker guide with MCP instructions

**Time estimate:** 2-3 hours investigation + 3-4 hours implementation

### Phase 3: Polish & Real-World Testing (PLANNED)

**Goal:** Use PadAI to build a real project and fix pain points.

**Tasks:**
- Deploy to Railway with real .beads/ project
- Have 3-4 Claude agents build something real (multiplayer Pac-Man?)
- Identify bottlenecks and UX issues
- Add WebSocket if polling feels slow
- Add Telegram bot if coordination needs human oversight

**Success criteria:**
- Agents successfully collaborate without conflicts
- Dashboard clearly shows progress
- Total coordination overhead < 10% of dev time

**Time estimate:** 1 day of testing + fixes

### Phase 4: Production Hardening (FUTURE)

Only if PadAI gets regular use:
- Authentication & multi-tenancy
- Monitoring & logging
- Horizontal scaling
- Task assignment strategies
- Web UI for task creation

## Open Questions

1. **How do we initialize .beads/ on the server?**
   - Option A: Git clone a project repo that has .beads/
   - Option B: Start with empty .beads/, let workers create tasks via API
   - **Decision: Option A for MVP** - simpler, we already have beads repos

2. **Should dashboard be served from same Express server or separate?**
   - **Decision: Same server** - simpler deployment, one Railway service

3. **How to handle bd CLI errors (task not found, invalid status, etc.)?**
   - **Decision: Return error to caller** - let workers handle retries

## Technical Risks

**Risk 1: Concurrent bd updates cause conflicts**
- Mitigation: bd uses file locking, should handle this
- Fallback: Add simple mutex in Express if needed

**Risk 2: Railway free tier limits**
- Mitigation: Monitor usage, upgrade to $5/mo plan if needed
- Alternative: Switch to Fly.io or DigitalOcean

**Risk 3: Polling creates too much load**
- Mitigation: Start with 5s interval, increase if needed
- Fallback: Add WebSocket if polling becomes problematic

## Future Enhancements (Post-MVP)

Once the MVP proves valuable, consider:

- MCP server for cleaner worker integration (no manual curl commands)
- WebSocket for sub-second dashboard updates
- Telegram bot for notifications on critical events
- Agent registry showing which agents are alive and what they're working on
- Task assignment strategies (load balancing, priority-based claiming)
- Web UI for creating tasks (not just visualizing)
- Export execution logs/analytics

## Success Stories

The first real test will be building the **Multiplayer Pac-Man** game we prototyped, using PadAI to coordinate:
- ARCHITECT agent (design work)
- NEXUS agent (server implementation)
- PHANTOM agent (maze system)
- VOLT agent (ghost AI)

If these 4 agents can successfully collaborate to build a working game without stepping on each other, PadAI is validated.

---

**Author:** Built collaboratively with Claude Code
**Date:** 2025-11-15
**Status:** Design approved, ready for implementation
