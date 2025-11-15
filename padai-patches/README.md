# PadAI Phase 1 Git Patches (UPDATED)

These patch files contain all 7 commits for PadAI Phase 1 implementation with clean repository structure.

## How to Apply to Your PadAI Repo

### Method 1: Apply All Patches at Once (Recommended)

```bash
# On your local machine
cd ~/path/to/PadAI

# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Clone the claude-code repo to get the patches
git clone https://github.com/bhi5hmaraj/claude-code.git /tmp/claude-code
cd /tmp/claude-code
git checkout claude/litellm-gemini-integration-013MB7pqddYauBbnNeefgNom

# Apply all patches in order
cd ~/path/to/PadAI
git am /tmp/claude-code/padai-patches/*.patch

# Push to your PadAI repo
git push origin main

# Or create a feature branch first
git checkout -b feature/phase1-implementation
git push -u origin feature/phase1-implementation
```

### Method 2: Cherry-pick Specific Patches

```bash
cd ~/path/to/PadAI

# Apply specific patches
git am /tmp/claude-code/padai-patches/0001-Add-PadAI-MVP-design-doc-and-task-breakdown.patch
git am /tmp/claude-code/padai-patches/0002-Implement-PadAI-Master-Server-core-functionality-pad.patch
# ... and so on
```

### Method 3: Review Before Applying

```bash
# View what a patch contains
git apply --stat /tmp/claude-code/padai-patches/0001-*.patch

# Check if it applies cleanly (dry run)
git apply --check /tmp/claude-code/padai-patches/0001-*.patch

# Apply it
git am /tmp/claude-code/padai-patches/0001-*.patch
```

## Patches Included

1. **0001-Add-PadAI-MVP-design-doc-and-task-breakdown.patch** (26KB)
   - DESIGN.md with complete architecture
   - TASKS.md with 17 implementation tasks
   - Initial .beads/ setup

2. **0002-Implement-PadAI-Master-Server-core-functionality-pad.patch** (13KB)
   - Express/TypeScript server structure
   - bd CLI wrapper (beads.ts)
   - API endpoints: /status, /claim, /complete

3. **0003-Add-Docker-and-deployment-configuration-padai-8.patch** (6.6KB)
   - Dockerfile with bd CLI installation
   - Railway.json for deployment
   - Docker Compose setup

4. **0004-Add-comprehensive-test-suite-for-PadAI-server.patch** (19KB)
   - Jest test suite
   - Unit tests for beads.ts
   - Integration tests for API endpoints

5. **0005-Implement-PadAI-Phase-1-MVP.patch** (39KB)
   - FastAPI backend (main.py, beads.py)
   - React Flow frontend (frontend/)
   - Complete rewrite from Express to FastAPI

6. **0006-Add-worker-documentation-and-Phase-2-roadmap.patch** (20KB)
   - WORKER_GUIDE.md
   - .claude/commands/padai-worker.md
   - Updated README.md and DESIGN.md
   - Phase 2 roadmap with beads-mcp exploration

7. **0007-Clean-up-repository-structure-archive-old-code.patch** (16KB) **[NEW]**
   - Archive old root-level React viz to archive/original-viz/
   - Archive Express server to archive/express-server/
   - Clean project structure with single frontend/
   - Updated README with structure diagram
   - archive/README.md documenting deprecated code

## Final Structure

After applying all patches, your PadAI repo will have:

```
PadAI/
├── main.py              # FastAPI server
├── beads.py             # bd CLI wrapper
├── requirements.txt
├── Dockerfile
├── railway.json
├── test-agent.sh
│
├── frontend/            # SINGLE React dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/TaskGraph.tsx
│   └── package.json
│
├── docs/
│   ├── DESIGN.md
│   └── TASKS.md
│
├── .claude/commands/
│   └── padai-worker.md
│
├── WORKER_GUIDE.md
│
└── archive/             # Deprecated code (for reference)
    ├── original-viz/    # Old standalone visualizer
    ├── express-server/  # Old TypeScript server
    └── README.md        # Explains what's archived
```

**Clean structure benefits:**
- Single source of truth for UI (frontend/)
- No duplication of React Flow code
- Clear separation of active vs archived code
- Dockerfile builds correctly from frontend/

## Total Changes

- **7 commits**
- **~140KB of patches**
- Clean, production-ready structure

## Troubleshooting

**If patches don't apply cleanly:**

```bash
# This means your PadAI repo has diverged
# You can try 3-way merge
git am -3 /tmp/claude-code/padai-patches/*.patch

# Or apply as regular patches (non-commit)
git apply /tmp/claude-code/padai-patches/*.patch
git add .
git commit -m "Apply Phase 1 patches"
```

**If you get conflicts:**

```bash
# Resolve conflicts in the files
# Then continue
git am --continue

# Or skip a patch
git am --skip

# Or abort
git am --abort
```

## After Applying

Once patches are applied, test the implementation:

```bash
# Test backend
cd ~/PadAI
pip install -r requirements.txt
WORKSPACE_PATH=/path/to/.beads python main.py

# Test frontend (in another terminal)
cd ~/PadAI/frontend
npm install
npm run dev

# Visit http://localhost:3000 for dashboard
# API docs at http://localhost:8000/docs
```

## Creating PR

After applying patches:

```bash
# Option 1: Push to main
git push origin main

# Option 2: Create feature branch (recommended)
git checkout -b feature/phase1-implementation
git push -u origin feature/phase1-implementation

# Then create PR on GitHub
gh pr create --title "Phase 1 MVP: FastAPI + React Flow Multi-Agent Coordination"
```
