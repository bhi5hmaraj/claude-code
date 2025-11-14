# Multi-Agent Platformer Game Development

## 🎮 Project: Build a Platformer Game with Multiple Claude Agents

This guide shows you how to run **multiple actual Claude Code instances** in parallel, coordinating via Beads to build a complete platformer game.

## Prerequisites

✅ Beads installed and initialized (`.beads/` directory exists)
✅ Claude Code v2.0.34 installed
✅ Beads slash commands available (`/beads-claim`, `/beads-discover`, etc.)

## Current Beads State

The game development tasks are ready in Beads:

```bash
cd /home/user/claude-code
bd --no-db list
```

**Tasks created:**
- `claude-8`: Build game engine core (canvas + game loop) **[P0 - START HERE]**
- `claude-9`: Implement physics system (gravity + collision) [P1]
- `claude-10`: Add keyboard input handling [P1]
- `claude-11`: Create player character with movement [P1]
- `claude-12`: Design platforms and level system [P1]
- `claude-13`: Add visual polish and rendering [P2]

**Dependencies:**
- Engine (claude-8) must be completed first (blocks everything)
- Physics (claude-9) blocks player (claude-11)
- Input (claude-10) blocks player (claude-11)
- Player (claude-11) and Levels (claude-12) block rendering (claude-13)

## How to Run Multiple Claude Instances

### Step 1: Open 3-4 Terminal Windows

Open separate terminal windows or tmux/screen sessions.

### Step 2: In Each Terminal, Start Claude

**Terminal 1 (Agent: Engine Developer)**
```bash
cd /home/user/claude-code
claude

# Once Claude loads:
> /beads-claim

# Claude will claim claude-8 (Game engine core)
# Then tell it: "Build the game engine core as described in the issue"
```

**Terminal 2 (Agent: Physics Developer)**
```bash
cd /home/user/claude-code
claude

# Once Claude loads:
> /beads-status
# Check what's available

> /beads-claim
# Will claim physics AFTER engine is complete

# Tell it: "Implement the physics system as described"
```

**Terminal 3 (Agent: Player Developer)**
```bash
cd /home/user/claude-code
claude

# Once Claude loads:
> /beads-claim
# Will wait for physics + input to complete

# Tell it: "Implement the player character"
```

**Terminal 4 (Agent: Level Designer)**
```bash
cd /home/user/claude-code
claude

# Once Claude loads:
> /beads-claim
# Will claim level design when ready

# Tell it: "Design the platforms and levels"
```

### Step 3: Agents Work and Coordinate

Each Claude instance:
1. Claims a task with `/beads-claim`
2. Works on the task (coding, testing)
3. Discovers new work with `/beads-discover` if needed
4. Completes with `/beads-complete`
5. Syncs with `/beads-sync`

### Step 4: Monitor Progress

In any terminal:
```bash
> /beads-status

# Shows:
# - What each agent is working on
# - What's ready to claim
# - What's blocked
# - Overall progress
```

## Workflow Example

### Iteration 1: Engine Agent

**Terminal 1:**
```
> /beads-claim
Claude claims: claude-8 (Build game engine core)

> Build the game engine with canvas, game loop, and requestAnimationFrame

Claude creates:
- examples/platformer-game/index.html
- examples/platformer-game/game.js (with game loop)

> /beads-complete claude-8
Claude marks complete, which unblocks physics and input!
```

### Iteration 2: Physics & Input (Parallel!)

**Terminal 2:**
```
> /beads-claim
Claude claims: claude-9 (Physics system)

> Implement gravity, velocity, and AABB collision detection

Claude adds physics code to game.js

> /beads-complete
```

**Terminal 3:**
```
> /beads-claim
Claude claims: claude-10 (Input handling)

> Add keyboard input for arrow keys, WASD, and spacebar

Claude adds input handling code

> /beads-complete
```

### Iteration 3: Player & Levels (After Physics)

**Terminal 2:**
```
> /beads-claim
Claude claims: claude-11 (Player character)

> Create player with movement and jumping

Claude implements player object

> /beads-discover Need to add double jump feature

> /beads-complete
```

**Terminal 4:**
```
> /beads-claim
Claude claims: claude-12 (Platforms and levels)

> Design platform layout and collision system

Claude adds platform array and level design

> /beads-complete
```

### Iteration 4: Polish

**Terminal 1:**
```
> /beads-claim
Claude claims: claude-13 (Visual polish)

> Add colors, animations, background, camera

Claude improves graphics

> /beads-complete
```

## Key Commands

### Check Ready Work
```bash
> /beads-status
```

### Claim Next Task
```bash
> /beads-claim
```

### Create New Task (When You Discover Something)
```bash
> /beads-discover Add particle effects for jump
```

### Complete Current Task
```bash
> /beads-complete claude-8
```

### Sync Changes Across Agents
```bash
> /beads-sync
```

## Tips for Multi-Agent Development

### 1. Start with High Priority
Always claim P0 tasks first (the engine in this case).

### 2. Sync Regularly
After completing a task, run `/beads-sync` to push changes to git so other agents can see them.

### 3. Coordinate via Dependencies
Don't try to work on player before physics is done - Beads will prevent claiming blocked tasks.

### 4. Discover New Work Dynamically
If you find something missing while working:
```bash
> /beads-discover Add sound effects system
```

### 5. Check Status Often
```bash
> /beads-status
```
Shows what everyone is working on.

## File Structure

```
/home/user/claude-code/
├── .beads/
│   └── issues.jsonl           # Shared task database
├── examples/
│   └── platformer-game/
│       ├── index.html         # Game HTML (created by engine agent)
│       └── game.js            # Game code (built by all agents)
└── .claude/
    └── commands/
        ├── beads-claim.md     # /beads-claim command
        ├── beads-discover.md  # /beads-discover command
        ├── beads-complete.md  # /beads-complete command
        ├── beads-status.md    # /beads-status command
        └── beads-sync.md      # /beads-sync command
```

## Expected Timeline

With 3-4 Claude instances running in parallel:

**Phase 1 (5-10 min)**: Engine agent builds core
**Phase 2 (10-15 min)**: Physics + Input agents work in parallel
**Phase 3 (15-20 min)**: Player + Levels agents work in parallel
**Phase 4 (10 min)**: Graphics agent adds polish

**Total: ~40 minutes** for a complete game (vs 2-3 hours with single agent)

## Monitoring

### View All Issues
```bash
bd --no-db list
```

### View Dependency Tree
```bash
bd --no-db dep tree claude-7
```

### View Completed Work
```bash
bd --no-db list --status completed
```

### View Blocked Work
```bash
bd --no-db blocked
```

## Troubleshooting

### "No ready work available"
Check dependencies:
```bash
bd --no-db blocked
```
Complete the blocking tasks first.

### Two Agents Claimed Same Task
Shouldn't happen - `/beads-claim` checks assignee first. But if it does:
```bash
bd --no-db list --status in_progress
# See who claimed what
```

### Git Conflicts in .beads/
```bash
bd --no-db merge .beads/issues.jsonl
git add .beads/
git commit -m "Merge beads state"
```

## Advanced: Agent Roles

Assign specialized roles:

**Architect**: Creates epics, decomposes tasks
**Implementer**: Claims and codes features
**Reviewer**: Reviews completed work, creates follow-ups
**Polish**: Adds visual improvements, animations

## Ready to Start?

1. **Open 3-4 terminals**
2. **In each, run**: `cd /home/user/claude-code && claude`
3. **In first terminal**: `/beads-claim` → Should claim `claude-8` (Engine)
4. **Tell Claude**: "Build the game engine core as described in the issue"
5. **Watch it work!**
6. **When done**: `/beads-complete`
7. **In other terminals**: `/beads-claim` → Each claims next ready task

## Success Criteria

Game is complete when:
- ✅ Player can move left/right
- ✅ Player can jump
- ✅ Gravity works
- ✅ Collision with platforms works
- ✅ Level is playable
- ✅ Visual polish added

Open `examples/platformer-game/index.html` in browser to play!

## Next Steps

After the game works:
- Add more levels
- Add enemies
- Add collectibles
- Add scoring system
- Add sound effects
- Add mobile controls

Each as a new Beads issue!

---

**Ready to build a game with multiple AI agents?**

Open those terminals and let's go! 🚀
