# PadAI MVP - Task Breakdown

## Epic: PadAI MVP - Multi-agent orchestration system

Build a lightweight master server that wraps bd CLI to enable multiple Claude Code agents to coordinate on tasks. Includes Express API, dashboard integration, and Railway deployment.

---

## Phase 1: Master Server (Priority 0)

### padai-1: Initialize server project structure
**Type:** task
**Priority:** 0
**Estimate:** 15 min
**Description:** Create `server/` directory with package.json, tsconfig.json, and basic Express setup. Install dependencies: express, cors, child_process.

**Acceptance Criteria:**
- server/package.json with express dependency
- server/tsconfig.json configured for Node 18+
- server/src/index.ts with basic Express app listening on port 3000

---

### padai-2: Implement bd CLI wrapper utility
**Type:** task
**Priority:** 0
**Estimate:** 20 min
**Blocks:** padai-3, padai-4, padai-5
**Description:** Create utility function that spawns bd CLI commands and returns parsed output. Handle errors, stderr, and exit codes properly.

**Acceptance Criteria:**
- Function: `executeBd(args: string[]): Promise<string>`
- Handles both success and error cases
- Properly parses JSON output from bd
- Logs commands for debugging

---

### padai-3: Implement GET /api/status endpoint
**Type:** task
**Priority:** 0
**Estimate:** 10 min
**Blocked By:** padai-2
**Description:** Create endpoint that returns bd status --json output. Should show all tasks with current status.

**Acceptance Criteria:**
- GET /api/status returns 200 with JSON
- Response matches bd status --json output
- CORS headers enabled

---

### padai-4: Implement POST /api/claim endpoint
**Type:** task
**Priority:** 0
**Estimate:** 30 min
**Blocked By:** padai-2
**Description:** Create endpoint that finds next ready task and assigns it to requesting agent. Atomically updates task status to in_progress.

**Acceptance Criteria:**
- POST /api/claim with body { agentName: string }
- Returns claimed task object or 404 if no tasks ready
- Updates task status and assignee in one operation
- Returns error if agent already has task in progress

---

### padai-5: Implement POST /api/complete endpoint
**Type:** task
**Priority:** 0
**Estimate:** 15 min
**Blocked By:** padai-2
**Description:** Create endpoint that marks a task as completed. Optionally accepts notes field.

**Acceptance Criteria:**
- POST /api/complete with body { taskId: string, notes?: string }
- Updates task status to completed
- Adds notes if provided
- Returns error if task not found or not in_progress

---

### padai-6: Add error handling and validation
**Type:** task
**Priority:** 1
**Estimate:** 20 min
**Blocked By:** padai-3, padai-4, padai-5
**Description:** Add proper error handling for all endpoints. Validate request bodies, handle bd CLI errors gracefully, return appropriate HTTP status codes.

**Acceptance Criteria:**
- Invalid requests return 400 with error message
- bd CLI errors return 500 with details
- Missing tasks return 404
- All errors logged to console

---

## Phase 2: Deployment (Priority 0)

### padai-7: Create Dockerfile for master server
**Type:** task
**Priority:** 0
**Estimate:** 30 min
**Blocked By:** padai-1
**Description:** Create Dockerfile that installs bd CLI binary and runs Express server. Use Node 18 alpine base image.

**Acceptance Criteria:**
- Dockerfile downloads bd-linux-amd64 from GitHub releases
- Installs to /usr/local/bin/bd with execute permissions
- Copies server code and installs dependencies
- Exposes port 3000
- CMD runs the server

---

### padai-8: Test local Docker build
**Type:** task
**Priority:** 0
**Estimate:** 15 min
**Blocked By:** padai-7
**Description:** Build Docker image locally and test all API endpoints work. Verify bd CLI is accessible inside container.

**Acceptance Criteria:**
- docker build succeeds
- docker run exposes port 3000
- curl to all 3 endpoints works
- bd --version returns successfully inside container

---

### padai-9: Deploy to Railway
**Type:** task
**Priority:** 0
**Estimate:** 30 min
**Blocked By:** padai-8
**Description:** Push to GitHub, connect Railway, deploy, and verify public URL works. Test from external machine.

**Acceptance Criteria:**
- GitHub repo pushed
- Railway connected to repo
- Deployment successful
- Public URL accessible (e.g., padai-production.up.railway.app)
- All endpoints respond correctly

---

## Phase 3: Dashboard Integration (Priority 1)

### padai-10: Add polling to dashboard
**Type:** task
**Priority:** 1
**Estimate:** 20 min
**Blocked By:** padai-9
**Description:** Update existing React dashboard to poll /api/status every 5 seconds. Parse response and update graph visualization.

**Acceptance Criteria:**
- setInterval fetches /api/status every 5s
- Parses response into BeadsIssue[] format
- Updates React Flow graph
- Shows loading state on first load

---

### padai-11: Add environment variable for server URL
**Type:** task
**Priority:** 1
**Estimate:** 10 min
**Blocked By:** padai-10
**Description:** Make server URL configurable via env var. Support both local dev (localhost:3000) and production (Railway URL).

**Acceptance Criteria:**
- VITE_PADAI_SERVER_URL environment variable
- Defaults to localhost:3000 in dev
- .env.example with Railway URL template
- README updated with setup instructions

---

### padai-12: Deploy dashboard to Railway static site
**Type:** task
**Priority:** 1
**Estimate:** 20 min
**Blocked By:** padai-11
**Description:** Build React app and deploy to Railway as static site. Configure CORS on server to allow dashboard origin.

**Acceptance Criteria:**
- npm run build creates dist/
- Railway serves static files
- Dashboard accessible at public URL
- CORS allows dashboard to call API
- Graph renders with live data

---

## Phase 4: Worker Integration (Priority 1)

### padai-13: Create example slash command for workers
**Type:** task
**Priority:** 1
**Estimate:** 20 min
**Blocked By:** padai-9
**Description:** Create .claude/commands/padai-claim.md that uses curl to claim tasks from PadAI server.

**Acceptance Criteria:**
- Slash command /padai-claim
- Uses Bash tool to curl POST /api/claim
- Displays claimed task details
- Saves task ID for later completion

---

### padai-14: Create example completion slash command
**Type:** task
**Priority:** 1
**Estimate:** 15 min
**Blocked By:** padai-13
**Description:** Create .claude/commands/padai-complete.md that marks current task as complete.

**Acceptance Criteria:**
- Slash command /padai-complete
- Accepts optional notes parameter
- Curls POST /api/complete with saved task ID
- Confirms completion

---

### padai-15: End-to-end multi-agent test
**Type:** task
**Priority:** 1
**Estimate:** 30 min
**Blocked By:** padai-12, padai-13, padai-14
**Description:** Test with 3 separate Claude Code sessions claiming and completing different tasks. Verify no conflicts occur and dashboard updates correctly.

**Acceptance Criteria:**
- Initialize test Beads repo with 5+ tasks
- 3 agents simultaneously claim different tasks
- Each agent completes their task
- No conflicts or duplicate claims
- Dashboard shows all updates within 5s
- All tasks marked completed

---

## Phase 5: Documentation (Priority 2)

### padai-16: Write README with quickstart
**Type:** task
**Priority:** 2
**Estimate:** 30 min
**Blocked By:** padai-15
**Description:** Update README.md with architecture overview, setup instructions, and usage examples.

**Acceptance Criteria:**
- Architecture diagram
- Setup steps (install bd, run server, deploy)
- Worker usage examples
- Dashboard URL
- Troubleshooting section

---

### padai-17: Create example multi-agent project
**Type:** task
**Priority:** 2
**Estimate:** 1 hour
**Blocked By:** padai-15
**Description:** Add examples/ directory with a real multi-agent project (e.g., the Multiplayer Pac-Man we built). Show how to structure tasks for parallel work.

**Acceptance Criteria:**
- examples/multiplayer-pacman/ with .beads/ folder
- Tasks broken down for 3-4 agents
- Dependencies properly set (blocks, related)
- README explaining the workflow
- Demonstrates successful coordination

---

## Summary

**Total Tasks:** 17
**Total Estimated Time:** ~6 hours
**Critical Path:** padai-1 → padai-2 → padai-4 → padai-6 → padai-7 → padai-8 → padai-9 → padai-15

**Phases:**
1. Master Server (6 tasks, ~2.5 hours)
2. Deployment (3 tasks, ~1.25 hours)
3. Dashboard Integration (3 tasks, ~50 min)
4. Worker Integration (3 tasks, ~1 hour)
5. Documentation (2 tasks, ~1.5 hours)

**First Deliverable:** After padai-9, you'll have a working API deployed to Railway that agents can use.

**MVP Complete:** After padai-15, the full system is validated and working end-to-end.
