# Multiplayer Pac-Man - Architectural Design
## Design Iteration 1

**Created by**: Proposer Agent
**Date**: 2025-11-14
**Status**: Initial Proposal

---

## 1. Executive Summary

This document outlines the architectural design for a real-time multiplayer Pac-Man game supporting 4 concurrent players. The system uses Colyseus for server-side game state management and real-time synchronization, with an HTML5 Canvas-based client for rendering.

**Key Features:**
- 4-player simultaneous gameplay
- Real-time state synchronization (<100ms latency)
- Server-authoritative game logic
- AI-controlled ghosts with distinct behaviors
- Collision detection and scoring system
- WebSocket-based communication

---

## 2. Tech Stack

### 2.1 Backend
- **Runtime**: Node.js v18+
- **Framework**: Colyseus 0.15+
- **Language**: TypeScript 5.0+
- **State Management**: Colyseus Schema
- **Build Tool**: TypeScript compiler (tsc)

### 2.2 Frontend
- **Renderer**: HTML5 Canvas API
- **Language**: JavaScript (ES6+)
- **Client SDK**: Colyseus Client SDK
- **Bundler**: None (vanilla JS for simplicity, can add Vite later)

### 2.3 Development Tools
- **Package Manager**: npm
- **Linter**: ESLint
- **Formatter**: Prettier
- **Version Control**: Git

### 2.4 Rationale
- **Colyseus**: Purpose-built for multiplayer games, handles room management and state sync
- **TypeScript**: Type safety for complex game logic, better developer experience
- **HTML5 Canvas**: Lightweight, performant, cross-platform
- **No framework**: Reduces bundle size, faster initial development

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐
│   Client 1      │──┐
│  (Browser)      │  │
└─────────────────┘  │
                     │     WebSocket (WSS)
┌─────────────────┐  │    ┌──────────────────────────┐
│   Client 2      │──┼────▶│   Colyseus Server       │
│  (Browser)      │  │    │  (Node.js + TypeScript)  │
└─────────────────┘  │    └──────────────────────────┘
                     │              │
┌─────────────────┐  │              │
│   Client 3      │──┤              ▼
│  (Browser)      │  │    ┌──────────────────────────┐
└─────────────────┘  │    │      Game Room           │
                     │    │   (State Machine)        │
┌─────────────────┐  │    │  - Players (4 max)       │
│   Client 4      │──┘    │  - Ghosts (4 AI)         │
│  (Browser)      │       │  - Maze                  │
└─────────────────┘       │  - Pellets               │
                          │  - Score/Timer           │
                          └──────────────────────────┘
```

### 3.2 Server-Client Communication

**Connection Flow:**
1. Client requests to join game room via HTTP
2. Server creates/assigns room (max 4 players per room)
3. WebSocket connection established
4. Full game state sent to client
5. Delta updates sent at 20Hz (50ms intervals)

**Message Types:**
- **Server → Client**: State updates (position, score, ghost AI)
- **Client → Server**: Input commands (movement direction, power-up activation)
- **Bidirectional**: Chat messages, player ready status

---

## 4. Data Models & State Schema

### 4.1 Game State (Root Schema)

```typescript
// schema/GameState.ts
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class GameState extends Schema {
  @type("number") gameStatus: number = 0; // 0: waiting, 1: playing, 2: game_over
  @type("number") timer: number = 180;     // 3-minute game
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([Ghost]) ghosts = new ArraySchema<Ghost>();
  @type({ map: Pellet }) pellets = new MapSchema<Pellet>();
  @type(Maze) maze: Maze = new Maze();
  @type("number") highScore: number = 0;
}
```

### 4.2 Player Schema

```typescript
// schema/Player.ts
export class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number;              // Grid position X
  @type("number") y: number;              // Grid position Y
  @type("number") direction: number;      // 0: up, 1: right, 2: down, 3: left
  @type("number") speed: number = 1;      // Tiles per second
  @type("number") score: number = 0;
  @type("number") lives: number = 3;
  @type("boolean") isPoweredUp: boolean = false;
  @type("number") powerUpTimer: number = 0; // Seconds remaining
  @type("number") color: number;          // Player color (0-3)
  @type("boolean") isAlive: boolean = true;
  @type("boolean") isReady: boolean = false;
}
```

### 4.3 Ghost Schema

```typescript
// schema/Ghost.ts
export class Ghost extends Schema {
  @type("string") id: string;
  @type("number") type: number;          // 0: Blinky, 1: Pinky, 2: Inky, 3: Clyde
  @type("number") x: number;
  @type("number") y: number;
  @type("number") direction: number;
  @type("number") mode: number;          // 0: scatter, 1: chase, 2: frightened, 3: eaten
  @type("number") modeTimer: number;     // Time until mode change
  @type("boolean") isVulnerable: boolean = false;
  @type("number") targetX: number;       // Pathfinding target
  @type("number") targetY: number;
}
```

### 4.4 Maze Schema

```typescript
// schema/Maze.ts
export class Maze extends Schema {
  @type("number") width: number = 28;    // Classic Pac-Man dimensions
  @type("number") height: number = 31;
  @type(["number"]) walls: number[];     // Flattened 2D array (1 = wall, 0 = path)
  @type("number") tileSize: number = 20; // Pixels per grid tile
}
```

### 4.5 Pellet Schema

```typescript
// schema/Pellet.ts
export class Pellet extends Schema {
  @type("string") id: string;            // "x,y" format
  @type("number") x: number;
  @type("number") y: number;
  @type("boolean") isPowerPellet: boolean = false;
  @type("number") value: number = 10;    // 10 for normal, 50 for power
  @type("boolean") collected: boolean = false;
}
```

---

## 5. Network Synchronization Strategy

### 5.1 Server-Authoritative Model

**Principle**: Server is the single source of truth. Clients send inputs, server processes, broadcasts results.

**Benefits:**
- Prevents cheating (all validation server-side)
- Consistent game state across all clients
- Easier to debug and maintain

### 5.2 State Update Frequency

- **Server Tick Rate**: 20 Hz (50ms per tick)
- **State Broadcast**: Delta-based updates (only changed properties)
- **Input Sampling**: Client sends input at 60 Hz, server processes at 20 Hz

### 5.3 Latency Handling

**Client-Side Prediction:**
```typescript
// Client predicts own position based on input
function predictPlayerPosition(player, input, deltaTime) {
  const predictedX = player.x + input.dx * player.speed * deltaTime;
  const predictedY = player.y + input.dy * player.speed * deltaTime;

  // Render predicted position
  render(predictedX, predictedY);

  // Server sends authoritative position, client reconciles
}
```

**Server Reconciliation:**
- Server sends authoritative positions every tick
- Client compares predicted vs. actual position
- If delta > threshold, snap to server position
- Otherwise, smooth interpolation

**Interpolation for Other Players:**
```typescript
// Smooth movement for remote players
function interpolatePosition(player, serverState, alpha) {
  player.renderX = lerp(player.lastX, serverState.x, alpha);
  player.renderY = lerp(player.lastY, serverState.y, alpha);
}
```

### 5.4 Bandwidth Optimization

- **Delta Compression**: Colyseus sends only changed state (built-in)
- **Message Batching**: Multiple inputs batched into single message
- **State Culling**: Only send visible portions of maze to each client
- **Estimated Bandwidth**: ~2-5 KB/s per client (well within limits)

---

## 6. File & Folder Structure

```
multiplayer-pacman/
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
│
├── server/                          # Colyseus Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                # Server entry point
│   │   ├── rooms/
│   │   │   └── GameRoom.ts         # Main game room logic
│   │   ├── schema/
│   │   │   ├── GameState.ts
│   │   │   ├── Player.ts
│   │   │   ├── Ghost.ts
│   │   │   ├── Maze.ts
│   │   │   └── Pellet.ts
│   │   ├── ai/
│   │   │   ├── GhostAI.ts          # Base AI class
│   │   │   ├── BlinkyAI.ts         # Chaser behavior
│   │   │   ├── PinkyAI.ts          # Ambusher behavior
│   │   │   ├── InkyAI.ts           # Patroller behavior
│   │   │   └── ClydeAI.ts          # Random behavior
│   │   ├── systems/
│   │   │   ├── CollisionSystem.ts  # AABB collision detection
│   │   │   ├── MovementSystem.ts   # Player/ghost movement
│   │   │   ├── ScoringSystem.ts    # Pellet collection, scoring
│   │   │   └── PathfindingSystem.ts # A* pathfinding for ghosts
│   │   ├── config/
│   │   │   └── gameConfig.ts       # Game constants (speed, scores, etc.)
│   │   └── utils/
│   │       ├── MazeGenerator.ts    # Maze layout generation
│   │       └── Logger.ts           # Server logging
│   └── .env
│
├── client/                          # HTML5 Frontend
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js                  # Client entry point
│   │   ├── game/
│   │   │   ├── GameClient.ts        # Colyseus client wrapper
│   │   │   ├── InputHandler.ts      # Keyboard input
│   │   │   ├── Renderer.ts          # Canvas rendering
│   │   │   ├── AudioManager.ts      # Sound effects
│   │   │   └── UIManager.ts         # HUD/menus
│   │   ├── entities/
│   │   │   ├── PlayerRenderer.ts
│   │   │   ├── GhostRenderer.ts
│   │   │   └── MazeRenderer.ts
│   │   └── utils/
│   │       ├── Vector2.ts
│   │       └── Interpolation.ts
│   └── assets/
│       ├── sprites/
│       │   ├── pacman.png
│       │   ├── ghosts.png
│       │   └── tiles.png
│       └── sounds/
│           ├── chomp.wav
│           ├── death.wav
│           ├── powerup.wav
│           └── ghost_eaten.wav
│
└── shared/                          # Shared types (if needed)
    └── types.ts
```

---

## 7. Real-Time Communication Flow

### 7.1 Game Initialization

```
1. Client loads → connects to Colyseus server
2. Server: room.onCreate()
   - Initialize maze
   - Spawn pellets
   - Create 4 ghosts with AI
3. Client: room.onJoin()
   - Receive full game state
   - Render initial scene
4. Wait for 4 players or 30-second timeout
5. All players ready → Server: startGame()
```

### 7.2 Game Loop (Server)

```typescript
// GameRoom.ts
export class GameRoom extends Room<GameState> {

  // 20Hz game loop
  private gameLoop = setInterval(() => {
    if (this.state.gameStatus !== 1) return; // Not playing

    // 1. Process player inputs (from message queue)
    this.processPlayerInputs();

    // 2. Update ghost AI
    this.updateGhostAI();

    // 3. Move all entities
    this.movementSystem.update(this.state, TICK_RATE);

    // 4. Check collisions
    this.collisionSystem.checkAll(this.state);

    // 5. Update power-up timers
    this.updatePowerUps();

    // 6. Check win/lose conditions
    this.checkGameOver();

    // 7. Update timer
    this.state.timer -= TICK_RATE;

    // State automatically synced by Colyseus (delta updates)
  }, 50); // 50ms = 20Hz
}
```

### 7.3 Input Processing

```typescript
// Client sends input
room.send("input", { direction: 1, timestamp: Date.now() });

// Server receives and validates
onMessage("input", (client, message) => {
  const player = this.state.players.get(client.sessionId);

  // Validate input
  if (message.direction < 0 || message.direction > 3) return;

  // Store for next tick processing
  this.inputQueue.push({ playerId: client.sessionId, ...message });
});
```

---

## 8. Multiplayer Considerations

### 8.1 4-Player Support

**Room Management:**
- Max 4 players per room
- Auto-matchmaking: join first available room with space
- Private rooms: custom room IDs for friend groups

**Player Differentiation:**
- Each player assigned unique color (red, pink, blue, orange)
- Different spawn points in corners of maze
- Individual score tracking

### 8.2 Latency Handling

**Target Latency**: <100ms round-trip
**Acceptable Range**: 100-200ms

**Strategies:**
1. **Client-Side Prediction**: Immediate visual feedback
2. **Server Reconciliation**: Correct predictions if wrong
3. **Interpolation**: Smooth other players' movements
4. **Input Buffering**: Queue inputs on server to handle packet loss

### 8.3 State Reconciliation

```typescript
// Client receives server state update
room.state.players.onChange = (player, key) => {
  const localPlayer = this.localPlayer;

  if (key === localPlayer.id) {
    // Reconcile own position
    const positionDelta = distance(player.x, player.y, localPlayer.predictedX, localPlayer.predictedY);

    if (positionDelta > RECONCILIATION_THRESHOLD) {
      // Snap to server position (prediction was wrong)
      localPlayer.x = player.x;
      localPlayer.y = player.y;
    } else {
      // Smooth interpolation
      localPlayer.x = lerp(localPlayer.x, player.x, 0.2);
      localPlayer.y = lerp(localPlayer.y, player.y, 0.2);
    }
  }
};
```

### 8.4 Disconnect Handling

**Player Disconnect:**
1. Server removes player from game state
2. Player's remaining pellets stay in game
3. Ghosts continue chasing remaining players
4. Remaining players notified via UI message

**Reconnection:**
- Within 30 seconds: rejoin same room, restore score
- After 30 seconds: session expired, start new game

---

## 9. Ghost AI Architecture

### 9.1 AI Behaviors (4 Distinct Types)

**Blinky (Red Ghost) - The Chaser:**
```typescript
class BlinkyAI extends GhostAI {
  calculateTarget(player: Player): { x: number, y: number } {
    // Chase nearest player directly
    return { x: player.x, y: player.y };
  }
}
```

**Pinky (Pink Ghost) - The Ambusher:**
```typescript
class PinkyAI extends GhostAI {
  calculateTarget(player: Player): { x: number, y: number } {
    // Target 4 tiles ahead of player's current direction
    const offset = 4;
    return {
      x: player.x + this.getDirectionOffset(player.direction).x * offset,
      y: player.y + this.getDirectionOffset(player.direction).y * offset
    };
  }
}
```

**Inky (Blue Ghost) - The Patroller:**
```typescript
class InkyAI extends GhostAI {
  calculateTarget(player: Player, blinky: Ghost): { x: number, y: number } {
    // Complex targeting based on player and Blinky's position
    const offset = 2;
    const vectorX = player.x + this.getDirectionOffset(player.direction).x * offset;
    const vectorY = player.y + this.getDirectionOffset(player.direction).y * offset;

    // Mirror Blinky's position around this vector
    return {
      x: vectorX + (vectorX - blinky.x),
      y: vectorY + (vectorY - blinky.y)
    };
  }
}
```

**Clyde (Orange Ghost) - The Random:**
```typescript
class ClydeAI extends GhostAI {
  calculateTarget(player: Player): { x: number, y: number } {
    const distanceToPlayer = distance(this.ghost.x, this.ghost.y, player.x, player.y);

    if (distanceToPlayer > 8) {
      // Chase player when far away
      return { x: player.x, y: player.y };
    } else {
      // Scatter to home corner when close
      return this.scatterTarget;
    }
  }
}
```

### 9.2 AI Mode System

**Modes:**
1. **Scatter**: Ghosts go to home corners (first 7 seconds)
2. **Chase**: Ghosts use behavior-specific targeting (20 seconds)
3. **Frightened**: Player has power pellet, ghosts flee randomly (10 seconds)
4. **Eaten**: Ghost returns to spawn, then resumes chase

**Mode Transitions:**
```
SCATTER (7s) → CHASE (20s) → SCATTER (5s) → CHASE (20s) → SCATTER (5s) → CHASE (permanent)
                    ↓
              FRIGHTENED (if power pellet) → return to previous mode
                    ↓
              EATEN (if caught while frightened) → spawn → CHASE
```

### 9.3 Pathfinding (A* Algorithm)

```typescript
class PathfindingSystem {
  findPath(start: {x, y}, goal: {x, y}, maze: Maze): {x, y}[] {
    // A* algorithm implementation
    const openSet = [start];
    const closedSet = [];

    while (openSet.length > 0) {
      // Get node with lowest f score
      const current = this.getLowestFScore(openSet);

      if (current.x === goal.x && current.y === goal.y) {
        return this.reconstructPath(current);
      }

      openSet.remove(current);
      closedSet.add(current);

      // Check neighbors (up, down, left, right)
      for (const neighbor of this.getNeighbors(current, maze)) {
        if (closedSet.includes(neighbor)) continue;

        const tentativeG = current.g + 1;

        if (!openSet.includes(neighbor)) {
          openSet.add(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.g = tentativeG;
        neighbor.h = this.heuristic(neighbor, goal);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
      }
    }

    return []; // No path found
  }

  heuristic(a: {x, y}, b: {x, y}): number {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
```

---

## 10. Collision Detection System

### 10.1 AABB Collision Detection

```typescript
class CollisionSystem {

  checkPlayerWallCollision(player: Player, maze: Maze): boolean {
    const nextX = player.x + player.dx * player.speed * deltaTime;
    const nextY = player.y + player.dy * player.speed * deltaTime;

    // Check all 4 corners of player's bounding box
    const corners = [
      { x: nextX - 0.4, y: nextY - 0.4 }, // Top-left
      { x: nextX + 0.4, y: nextY - 0.4 }, // Top-right
      { x: nextX - 0.4, y: nextY + 0.4 }, // Bottom-left
      { x: nextX + 0.4, y: nextY + 0.4 }  // Bottom-right
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x);
      const tileY = Math.floor(corner.y);

      if (maze.isWall(tileX, tileY)) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  }

  checkPlayerGhostCollision(player: Player, ghost: Ghost): boolean {
    const distance = Math.sqrt(
      Math.pow(player.x - ghost.x, 2) +
      Math.pow(player.y - ghost.y, 2)
    );

    return distance < 0.5; // Collision if centers within 0.5 tiles
  }

  checkPlayerPelletCollision(player: Player, pellets: MapSchema<Pellet>): Pellet | null {
    const playerTileX = Math.round(player.x);
    const playerTileY = Math.round(player.y);

    const pelletId = `${playerTileX},${playerTileY}`;
    const pellet = pellets.get(pelletId);

    if (pellet && !pellet.collected) {
      return pellet;
    }

    return null;
  }
}
```

### 10.2 Collision Resolution

**Player-Wall:**
- Prevent movement in that direction
- Allow sliding along walls

**Player-Ghost:**
- If ghost is vulnerable: ghost eaten, +200 points, ghost respawns
- If ghost is normal: player loses life, respawns at start

**Player-Pellet:**
- Remove pellet from game
- Add score (10 for normal, 50 for power)
- If power pellet: activate power-up mode (ghosts vulnerable for 10s)

---

## 11. Scoring System

### 11.1 Point Values

| Item | Points |
|------|--------|
| Normal Pellet | 10 |
| Power Pellet | 50 |
| Ghost (1st) | 200 |
| Ghost (2nd in sequence) | 400 |
| Ghost (3rd in sequence) | 800 |
| Ghost (4th in sequence) | 1600 |
| Bonus Fruit | 100-500 |

### 11.2 Win Conditions

**Individual Win:**
- Highest score when all pellets collected
- Highest score when timer runs out

**Team Win:** (Optional Mode)
- Combined score of team exceeds threshold

### 11.3 Leaderboard

```typescript
interface GameStats {
  playerId: string;
  playerName: string;
  finalScore: number;
  pelletsEaten: number;
  ghostsEaten: number;
  deaths: number;
  playtime: number; // seconds
}
```

---

## 12. Technical Challenges & Solutions

### 12.1 Challenge: Ghost AI Synchronization

**Problem**: 4 AI ghosts calculating paths every tick = CPU intensive

**Solution**:
- Stagger pathfinding updates (each ghost calculates every 4 ticks)
- Cache paths, recalculate only when target changes significantly
- Use optimized A* with early termination

### 12.2 Challenge: Fair Spawning with 4 Players

**Problem**: All players spawning at same location = instant collision

**Solution**:
- 4 spawn points in maze corners
- Assign spawn based on join order
- 3-second invincibility after spawn/death

### 12.3 Challenge: Network Bandwidth with 4 Clients

**Problem**: Broadcasting full state to 4 clients every 50ms

**Solution**:
- Colyseus delta compression (only changed properties)
- Send only relevant state (culling based on visibility)
- Compress repeated data (ghost positions as arrays)

### 12.4 Challenge: Handling Variable Latency

**Problem**: Players with different ping times see game differently

**Solution**:
- Server timestamp on all state updates
- Client-side interpolation with time buffering
- Input prediction for local player
- Server reconciliation with soft corrections

---

## 13. Security Considerations

### 13.1 Input Validation

```typescript
onMessage("input", (client, message) => {
  // Validate direction
  if (![0, 1, 2, 3].includes(message.direction)) {
    console.warn(`Invalid direction from ${client.sessionId}`);
    return;
  }

  // Rate limiting
  const now = Date.now();
  if (now - this.lastInputTime[client.sessionId] < 10) { // Max 100 inputs/sec
    return;
  }
  this.lastInputTime[client.sessionId] = now;

  // Process valid input
  this.inputQueue.push({ playerId: client.sessionId, ...message });
});
```

### 13.2 Cheat Prevention

**Server-Authoritative**:
- All game logic runs on server
- Clients only send inputs, never positions
- Server validates all movements against maze/collision

**Rate Limiting**:
- Max input rate per client
- Max room join rate per IP

---

## 14. Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Server Tick Rate | 20 Hz | Smooth gameplay, manageable CPU |
| Client Frame Rate | 60 FPS | Smooth rendering |
| Round-Trip Latency | <100ms | Responsive controls |
| Max Concurrent Rooms | 100 | Scalability (can increase with load balancing) |
| Memory per Room | <50MB | Cost-effective scaling |
| State Update Size | <2KB | Bandwidth efficiency |

---

## 15. Development Phases

### Phase 1: Foundation (Week 1)
- Server setup (Colyseus + TypeScript)
- Client setup (HTML5 Canvas)
- Basic schema definition
- Connection establishment

### Phase 2: Core Mechanics (Week 2)
- Maze generation and rendering
- Player movement and collision
- Pellet system
- Basic scoring

### Phase 3: Multiplayer (Week 3)
- Multi-player support
- State synchronization
- Latency handling
- Client-side prediction

### Phase 4: Ghost AI (Week 4)
- AI behaviors (4 types)
- Pathfinding (A*)
- Mode transitions
- Power-up mechanics

### Phase 5: Polish (Week 5)
- UI/HUD
- Sound effects
- Visual improvements
- Game over/win screens

### Phase 6: Testing & Deployment (Week 6)
- Performance optimization
- Security hardening
- Load testing
- Deployment to cloud (Heroku/DigitalOcean)

---

## 16. Open Questions & Assumptions

### Assumptions:
1. Players have stable internet (50+ Mbps)
2. Modern browsers (Chrome, Firefox, Safari latest)
3. Keyboard input (can add mobile later)
4. Classic Pac-Man maze layout (28x31 grid)
5. 3-minute game duration

### Open Questions for Critique:
1. Should we support reconnection mid-game?
2. How to handle tie scores (sudden death, tie break)?
3. Mobile support in V1 or defer to V2?
4. Voice chat integration needed?
5. Spectator mode for 5+ players?

---

## 17. Conclusion

This architecture provides a solid foundation for a real-time multiplayer Pac-Man game. The design prioritizes:

- **Performance**: 20Hz tick rate, delta compression
- **Fairness**: Server-authoritative, validated inputs
- **Scalability**: Room-based architecture, load balancing ready
- **Maintainability**: TypeScript, clear separation of concerns
- **User Experience**: Latency handling, smooth interpolation

**Ready for critique and iteration.**

---

**Next Steps:**
1. Review by Critique Agent
2. Address feedback
3. Refine design
4. Proceed to implementation

**Design Quality Self-Assessment**: 75/100
- Strong technical foundation
- Some areas need more detail (reconnection, mobile support)
- Performance targets may need validation through prototyping
