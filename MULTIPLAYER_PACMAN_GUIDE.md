# Multiplayer Pac-Man with Multi-Agent Development

## 🎮 Project Overview

Building a real-time multiplayer Pac-Man game using:
- **Colyseus** - Multiplayer game server framework
- **Node.js + TypeScript** - Backend
- **HTML5 Canvas** - Frontend
- **Multi-Agent Coordination** - Design iteration + parallel development

## 📋 Beads Task Structure

### Phase 1: Design Iteration (Proposer ↔ Critique, Max 4 Iterations)

**Workflow:**
```
Proposer Agent → Critique Agent → Proposer Agent → Critique Agent
    (claude-15)      (claude-16)      (claude-17)      (claude-18)
         ↓                ↓                ↓                ↓
    Iteration 1      Iteration 1      Iteration 2      Iteration 2
         ↓                                                  ↓
    (claude-19)      (claude-20)      (claude-21)      (claude-22)
         ↓                ↓                ↓                ↓
    Iteration 3      Iteration 3      Iteration 4      Iteration 4
                                                           ↓
                                                      (claude-23)
                                                    Finalize Design
```

**Tasks:**
- `claude-15`: Design Iteration 1 - Initial proposal (Proposer)
- `claude-16`: Design Iteration 1 - Critique
- `claude-17`: Design Iteration 2 - Refined proposal (Proposer)
- `claude-18`: Design Iteration 2 - Second critique
- `claude-19`: Design Iteration 3 - Second refinement (Proposer)
- `claude-20`: Design Iteration 3 - Third critique
- `claude-21`: Design Iteration 4 - Final design (Proposer)
- `claude-22`: Design Iteration 4 - Final approval (Critique)
- `claude-23`: Finalize design documentation

### Phase 2: Implementation (After Design Approved)

**Backend (Colyseus Server):**
- `claude-24`: Setup Colyseus server project [P1]
- `claude-25`: Implement game room and state management [P1]
- `claude-26`: Build maze generation and collision [P1]
- `claude-27`: Implement player movement [P1]
- `claude-28`: Create ghost AI and pathfinding [P1]
- `claude-29`: Add pellet collection and scoring [P1]

**Frontend (Client):**
- `claude-30`: Setup client project (HTML5 Canvas) [P1]
- `claude-31`: Implement client-side rendering [P1]
- `claude-32`: Add client input and network communication [P1]
- `claude-33`: Build UI and HUD [P2]

**Polish:**
- `claude-34`: Add sound effects and music [P3]
- `claude-35`: Implement power-ups [P3]
- `claude-36`: Add animations and visual polish [P3]

### Dependency Graph

```
Design Finalization (claude-23)
         ↓
    ┌────┴────┐
    ↓         ↓
Server Setup  Client Setup
(claude-24)   (claude-30)
    ↓             ↓
    ├─→ Game Room (claude-25) ─→ Client connects
    └─→ Maze (claude-26) ─────→ Rendering needs maze
         ↓
    Player Movement (claude-27) → Client Input
         ↓
    Ghost AI (claude-28)
         ↓
    Pellets (claude-29) → Power-ups
         ↓
    Rendering → UI → Audio/Animations
```

## 🚀 Launch Multi-Agent Development

### Option 1: Design Iteration Session (Start Here!)

Launch 2 agents for design iteration:

```bash
# Kill existing session if any
tmux kill-session -t pacman-design 2>/dev/null

# Create new session with 2 panes (Proposer + Critique)
tmux new-session -d -s pacman-design -n "Design-Iteration"

# Split horizontally
tmux split-window -h -t pacman-design

# Pane 0: Proposer Agent
tmux select-pane -t pacman-design:0.0 -T "Proposer"
tmux send-keys -t pacman-design:0.0 "cd /home/user/claude-code" C-m
tmux send-keys -t pacman-design:0.0 "echo '📐 PROPOSER AGENT: Design Architecture'" C-m
tmux send-keys -t pacman-design:0.0 "echo 'Starting Claude...'" C-m
tmux send-keys -t pacman-design:0.0 "claude" C-m

# Wait for Claude to load
sleep 5

# Send claim command to Proposer
tmux send-keys -t pacman-design:0.0 "/beads-claim" C-m
sleep 2
tmux send-keys -t pacman-design:0.0 "Create initial architectural design for multiplayer Pac-Man game. Include: tech stack (Colyseus, Node.js, TypeScript, HTML5 Canvas), game state structure, network synchronization strategy, file/folder organization, data models for players/ghosts/maze, real-time communication flow. Be specific and comprehensive. Save as DESIGN_ITERATION_1.md" C-m

# Pane 1: Critique Agent
tmux select-pane -t pacman-design:0.1 -T "Critique"
tmux send-keys -t pacman-design:0.1 "cd /home/user/claude-code" C-m
tmux send-keys -t pacman-design:0.1 "echo '🔍 CRITIQUE AGENT: Review & Feedback'" C-m
tmux send-keys -t pacman-design:0.1 "echo 'Waiting for Proposer to complete...'" C-m
tmux send-keys -t pacman-design:0.1 "echo 'Will claim claude-16 when ready'" C-m

# Attach to session
tmux attach -t pacman-design
```

**Layout:**
```
┌─────────────────────────┬─────────────────────────┐
│  PROPOSER AGENT         │  CRITIQUE AGENT         │
│  (Design Architecture)  │  (Review & Feedback)    │
│                         │                         │
│  Task: claude-15        │  Waiting for: claude-15 │
│  Creates proposals      │  Provides critique      │
└─────────────────────────┴─────────────────────────┘
```

**Workflow:**
1. **Proposer** claims `claude-15`, creates initial design
2. **Proposer** calls `/beads-complete` when done
3. **Critique** agent (run `/beads-claim`) claims `claude-16`
4. **Critique** reviews design, provides feedback, completes
5. **Proposer** claims `claude-17` (iteration 2), addresses feedback
6. Repeat for up to 4 iterations
7. Final agent claims `claude-23` to compile final design doc

### Option 2: Implementation Session (After Design Complete)

Launch 6+ agents for parallel development:

```bash
# Kill existing session
tmux kill-session -t pacman-dev 2>/dev/null

# Create new session with 6 panes
tmux new-session -d -s pacman-dev -n "Multiplayer-Dev"

# Create 2x3 grid layout
tmux split-window -v -t pacman-dev    # Split vertically (top/bottom)
tmux split-window -h -t pacman-dev:0.0  # Split top horizontally
tmux split-window -h -t pacman-dev:0.2  # Split bottom horizontally
tmux select-pane -t pacman-dev:0.1
tmux split-window -v -t pacman-dev    # Split middle-left vertically
tmux select-pane -t pacman-dev:0.3
tmux split-window -v -t pacman-dev    # Split middle-right vertically

# Configure each pane
# Pane 0: Server Setup
tmux send-keys -t pacman-dev:0.0 "cd /home/user/claude-code && echo '🖥️  AGENT: Server Setup' && claude" C-m

# Pane 1: Game Room & State
tmux send-keys -t pacman-dev:0.1 "cd /home/user/claude-code && echo '🎮 AGENT: Game Room' && claude" C-m

# Pane 2: Maze & Collision
tmux send-keys -t pacman-dev:0.2 "cd /home/user/claude-code && echo '🗺️  AGENT: Maze System' && claude" C-m

# Pane 3: Player Movement
tmux send-keys -t pacman-dev:0.3 "cd /home/user/claude-code && echo '🏃 AGENT: Player Movement' && claude" C-m

# Pane 4: Ghost AI
tmux send-keys -t pacman-dev:0.4 "cd /home/user/claude-code && echo '👻 AGENT: Ghost AI' && claude" C-m

# Pane 5: Client & Rendering
tmux send-keys -t pacman-dev:0.5 "cd /home/user/claude-code && echo '🎨 AGENT: Client & Rendering' && claude" C-m

# Attach
tmux attach -t pacman-dev
```

**Layout:**
```
┌────────────────┬────────────────┬────────────────┐
│ Server Setup   │ Game Room      │ Maze System    │
│ (claude-24)    │ (claude-25)    │ (claude-26)    │
├────────────────┼────────────────┼────────────────┤
│ Player Move    │ Ghost AI       │ Client/Render  │
│ (claude-27)    │ (claude-28)    │ (claude-30/31) │
└────────────────┴────────────────┴────────────────┘
```

### Option 3: Full Stack (All-in-One Command)

```bash
# Design iteration first
cd /home/user/claude-code

# Launch design session
tmux kill-session -t pacman-design 2>/dev/null
tmux new-session -d -s pacman-design -n "Design"
tmux split-window -h -t pacman-design
tmux send-keys -t pacman-design:0.0 "cd /home/user/claude-code && claude" C-m
tmux send-keys -t pacman-design:0.1 "cd /home/user/claude-code && echo 'Critique Agent (claim when ready): /beads-claim'" C-m

# Send proposer prompt
sleep 8
tmux send-keys -t pacman-design:0.0 "/beads-claim" C-m
sleep 2
tmux send-keys -t pacman-design:0.0 "Create comprehensive architectural design for multiplayer Pac-Man with Colyseus. Include all technical specifications." C-m

# Attach to design session
tmux attach -t pacman-design

# After design complete, run implementation session:
# (Run the implementation command from Option 2)
```

## 📊 Monitor Progress

### Check Current Status

```bash
# See all tasks
bd --no-db list

# See ready work
bd --no-db ready

# See in-progress tasks (what agents are working on)
bd --no-db list --status in_progress

# See dependency tree
bd --no-db dep tree claude-14
```

### Beads Slash Commands (Use in Claude)

```bash
# Claim next ready task
/beads-claim

# Create discovered task
/beads-discover <description>

# Complete current task
/beads-complete

# Check multi-agent status
/beads-status

# Sync with git
/beads-sync
```

## 🎯 Development Phases

### Phase 1: Design Iteration (Est: 30-60 min)

**Agents:** 2 (Proposer + Critique)
**Tasks:** 9 tasks (4 iterations max)
**Goal:** Approved architecture design

**Success Criteria:**
- Design quality ≥80 after max 4 iterations
- Complete DESIGN.md document created
- All technical questions answered

### Phase 2: Backend Implementation (Est: 2-3 hours)

**Agents:** 3-4 (Server, Game Logic, AI, State)
**Tasks:** 6 backend tasks
**Goal:** Working Colyseus server with full game logic

**Success Criteria:**
- Server runs without errors
- Game rooms can be created/joined
- Player movement works
- Ghost AI functions
- Pellet collection works

### Phase 3: Frontend Implementation (Est: 1-2 hours)

**Agents:** 2-3 (Client, Rendering, Input)
**Tasks:** 4 frontend tasks
**Goal:** Playable browser client

**Success Criteria:**
- Client connects to server
- Game renders correctly
- Input controls work
- Real-time sync functional

### Phase 4: Polish (Est: 1-2 hours)

**Agents:** 2-3 (Audio, Animations, Power-ups)
**Tasks:** 3 polish tasks
**Goal:** Fully playable game

**Success Criteria:**
- Sounds and music work
- Animations smooth
- Power-ups functional
- Game feels complete

## 🛠️ Quick Reference

### Start Design Iteration
```bash
tmux kill-session -t pacman-design 2>/dev/null && \
tmux new-session -d -s pacman-design && \
tmux split-window -h -t pacman-design && \
tmux send-keys -t pacman-design:0.0 "cd /home/user/claude-code && claude" C-m && \
tmux send-keys -t pacman-design:0.1 "cd /home/user/claude-code && claude" C-m && \
sleep 8 && \
tmux send-keys -t pacman-design:0.0 "/beads-claim" C-m && \
tmux attach -t pacman-design
```

### Start Implementation (After Design Done)
```bash
tmux kill-session -t pacman-dev 2>/dev/null && \
tmux new-session -d -s pacman-dev && \
tmux split-window -v -t pacman-dev && \
tmux split-window -h -t pacman-dev:0.0 && \
tmux split-window -h -t pacman-dev:0.1 && \
for i in {0..3}; do tmux send-keys -t pacman-dev:0.$i "cd /home/user/claude-code && claude" C-m; done && \
sleep 10 && \
for i in {0..3}; do tmux send-keys -t pacman-dev:0.$i "/beads-claim" C-m; sleep 2; done && \
tmux attach -t pacman-dev
```

### View All Sessions
```bash
tmux list-sessions
```

### Kill All Sessions
```bash
tmux kill-session -t pacman-design
tmux kill-session -t pacman-dev
```

## 📁 Expected File Structure (After Completion)

```
multiplayer-pacman/
├── DESIGN.md                    # Final design document
├── server/                      # Colyseus backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts            # Server entry
│   │   ├── rooms/
│   │   │   └── GameRoom.ts     # Main game room
│   │   ├── schema/
│   │   │   ├── GameState.ts    # State schema
│   │   │   ├── Player.ts
│   │   │   └── Ghost.ts
│   │   ├── ai/
│   │   │   └── GhostAI.ts      # Ghost behaviors
│   │   └── utils/
│   │       ├── Maze.ts
│   │       └── Pathfinding.ts
│   └── .env
├── client/                      # HTML5 frontend
│   ├── index.html
│   ├── styles.css
│   ├── game.js                  # Main game client
│   ├── renderer.js              # Canvas rendering
│   ├── input.js                 # Input handling
│   └── assets/
│       ├── sounds/
│       └── sprites/
└── README.md
```

## 🎮 Ready to Start!

**Step 1: Launch Design Iteration**
```bash
# Copy-paste this entire command:
cd /home/user/claude-code && \
tmux kill-session -t pacman-design 2>/dev/null && \
tmux new-session -d -s pacman-design && \
tmux split-window -h -t pacman-design && \
tmux send-keys -t pacman-design:0.0 "cd /home/user/claude-code && claude" C-m && \
tmux send-keys -t pacman-design:0.1 "cd /home/user/claude-code && claude" C-m && \
sleep 10 && \
tmux send-keys -t pacman-design:0.0 "/beads-claim" C-m && \
sleep 2 && \
tmux send-keys -t pacman-design:0.0 "Create comprehensive architectural design for multiplayer Pac-Man with Colyseus, including tech stack, state structure, network strategy, and file organization. Save as DESIGN_ITERATION_1.md" C-m && \
tmux attach -t pacman-design
```

Watch the Proposer and Critique agents iterate on the design!

When Proposer completes iteration 1, switch to Critique pane (`Ctrl+B` then arrow key) and run `/beads-claim` to start the critique.

---

**Built with Beads Multi-Agent Orchestration** 🎮
