// Ghost AI System
// Built by VOLT agent 🔮

import { Ghost, Player } from "../schema/GameState";
import { Pathfinding } from "../utils/Pathfinding";
import { Maze } from "../utils/Maze";
import { GAME_CONFIG, GhostMode } from "../config/GameConstants";

export abstract class GhostAI {
  protected ghost: Ghost;
  protected pathfinding: Pathfinding;
  protected maze: Maze;
  protected scatterTarget: { x: number, y: number };

  constructor(ghost: Ghost, maze: Maze, pathfinding: Pathfinding) {
    this.ghost = ghost;
    this.maze = maze;
    this.pathfinding = pathfinding;
    this.scatterTarget = { x: 0, y: 0 };
  }

  // Abstract method - each ghost has unique targeting
  abstract calculateTarget(players: Player[]): { x: number, y: number };

  // Update ghost position and behavior
  update(deltaTime: number, players: Player[]) {
    if (this.ghost.mode === GhostMode.FRIGHTENED) {
      this.updateFrightened();
    } else if (this.ghost.mode === GhostMode.EATEN) {
      this.returnToSpawn();
    } else {
      // CHASE or SCATTER mode
      const target = this.ghost.mode === GhostMode.SCATTER
        ? this.scatterTarget
        : this.calculateTarget(players);

      this.ghost.targetX = target.x;
      this.ghost.targetY = target.y;

      this.moveTowardsTarget(deltaTime);
    }
  }

  protected moveTowardsTarget(deltaTime: number) {
    const direction = this.pathfinding.getNextDirection(
      { x: this.ghost.x, y: this.ghost.y },
      { x: this.ghost.targetX, y: this.ghost.targetY }
    );

    if (direction === -1) return; // No valid path

    const speed = GAME_CONFIG.GHOST_SPEED;
    const distance = speed * (deltaTime / 1000);

    switch (direction) {
      case 0: // UP
        this.ghost.y -= distance;
        break;
      case 1: // RIGHT
        this.ghost.x += distance;
        break;
      case 2: // DOWN
        this.ghost.y += distance;
        break;
      case 3: // LEFT
        this.ghost.x -= distance;
        break;
    }
  }

  protected updateFrightened() {
    // Frightened mode - move randomly
    const neighbors = this.maze.getNeighbors(
      Math.floor(this.ghost.x),
      Math.floor(this.ghost.y)
    );

    if (neighbors.length > 0) {
      const random = neighbors[Math.floor(Math.random() * neighbors.length)];
      this.ghost.targetX = random.x;
      this.ghost.targetY = random.y;
    }
  }

  protected returnToSpawn() {
    // Return to ghost spawn when eaten
    const spawn = this.maze.getGhostSpawn();
    this.ghost.targetX = spawn.x;
    this.ghost.targetY = spawn.y;

    // Check if reached spawn
    const distance = Math.sqrt(
      Math.pow(this.ghost.x - spawn.x, 2) +
      Math.pow(this.ghost.y - spawn.y, 2)
    );

    if (distance < 0.5) {
      this.ghost.mode = GhostMode.CHASE; // Resume chase mode
      this.ghost.isVulnerable = false;
    }
  }

  protected getClosestPlayer(players: Player[]): Player | null {
    let closest: Player | null = null;
    let minDistance = Infinity;

    for (const player of players) {
      if (!player.isAlive) continue;

      const distance = Math.sqrt(
        Math.pow(this.ghost.x - player.x, 2) +
        Math.pow(this.ghost.y - player.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = player;
      }
    }

    return closest;
  }
}

// 👻 BLINKY (Red) - Aggressive Direct Chaser
export class BlinkyAI extends GhostAI {
  constructor(ghost: Ghost, maze: Maze, pathfinding: Pathfinding) {
    super(ghost, maze, pathfinding);
    this.scatterTarget = { x: 25, y: 1 }; // Top-right corner
  }

  calculateTarget(players: Player[]): { x: number, y: number } {
    // Chase the closest player directly
    const target = this.getClosestPlayer(players);
    return target ? { x: target.x, y: target.y } : this.scatterTarget;
  }
}

// 💗 PINKY (Pink) - Ambusher (targets ahead of player)
export class PinkyAI extends GhostAI {
  constructor(ghost: Ghost, maze: Maze, pathfinding: Pathfinding) {
    super(ghost, maze, pathfinding);
    this.scatterTarget = { x: 1, y: 1 }; // Top-left corner
  }

  calculateTarget(players: Player[]): { x: number, y: number } {
    const target = this.getClosestPlayer(players);
    if (!target) return this.scatterTarget;

    // Target 4 tiles ahead of player's current direction
    const offset = 4;
    let targetX = target.x;
    let targetY = target.y;

    switch (target.direction) {
      case 0: // UP
        targetY -= offset;
        break;
      case 1: // RIGHT
        targetX += offset;
        break;
      case 2: // DOWN
        targetY += offset;
        break;
      case 3: // LEFT
        targetX -= offset;
        break;
    }

    return { x: targetX, y: targetY };
  }
}

// 💙 INKY (Cyan) - Patrol / Complex Targeting
export class InkyAI extends GhostAI {
  private blinky: Ghost | null = null;

  constructor(ghost: Ghost, maze: Maze, pathfinding: Pathfinding) {
    super(ghost, maze, pathfinding);
    this.scatterTarget = { x: 25, y: 29 }; // Bottom-right corner
  }

  setBlinky(blinky: Ghost) {
    this.blinky = blinky;
  }

  calculateTarget(players: Player[]): { x: number, y: number } {
    const target = this.getClosestPlayer(players);
    if (!target || !this.blinky) return this.scatterTarget;

    // Complex targeting: Use Blinky's position for calculation
    const offset = 2;
    let playerAheadX = target.x;
    let playerAheadY = target.y;

    switch (target.direction) {
      case 0: playerAheadY -= offset; break;
      case 1: playerAheadX += offset; break;
      case 2: playerAheadY += offset; break;
      case 3: playerAheadX -= offset; break;
    }

    // Vector from Blinky to point ahead of player, then double it
    const vectorX = (playerAheadX - this.blinky.x) * 2;
    const vectorY = (playerAheadY - this.blinky.y) * 2;

    return {
      x: this.blinky.x + vectorX,
      y: this.blinky.y + vectorY
    };
  }
}

// 🧡 CLYDE (Orange) - Random / Shy (chases when far, scatters when close)
export class ClydeAI extends GhostAI {
  constructor(ghost: Ghost, maze: Maze, pathfinding: Pathfinding) {
    super(ghost, maze, pathfinding);
    this.scatterTarget = { x: 1, y: 29 }; // Bottom-left corner
  }

  calculateTarget(players: Player[]): { x: number, y: number } {
    const target = this.getClosestPlayer(players);
    if (!target) return this.scatterTarget;

    const distance = Math.sqrt(
      Math.pow(this.ghost.x - target.x, 2) +
      Math.pow(this.ghost.y - target.y, 2)
    );

    // Shy behavior: Chase when far (>8 tiles), scatter when close
    if (distance > 8) {
      return { x: target.x, y: target.y };
    } else {
      return this.scatterTarget;
    }
  }
}

// Ghost AI Manager
export class GhostAIManager {
  private ghostAIs: Map<string, GhostAI> = new Map();
  private modeTimer: number = 0;
  private currentMode: GhostMode = GhostMode.SCATTER;
  private modeSequence: { mode: GhostMode, duration: number }[] = [
    { mode: GhostMode.SCATTER, duration: 7000 },
    { mode: GhostMode.CHASE, duration: 20000 },
    { mode: GhostMode.SCATTER, duration: 5000 },
    { mode: GhostMode.CHASE, duration: 20000 },
    { mode: GhostMode.SCATTER, duration: 5000 },
    { mode: GhostMode.CHASE, duration: Infinity } // Permanent chase
  ];
  private sequenceIndex: number = 0;

  constructor(ghosts: Ghost[], maze: Maze) {
    const pathfinding = new Pathfinding(maze);

    // Create AI instances for each ghost
    const blinkyAI = new BlinkyAI(ghosts[0], maze, pathfinding);
    const pinkyAI = new PinkyAI(ghosts[1], maze, pathfinding);
    const inkyAI = new InkyAI(ghosts[2], maze, pathfinding);
    const clydeAI = new ClydeAI(ghosts[3], maze, pathfinding);

    inkyAI.setBlinky(ghosts[0]); // Inky needs Blinky reference

    this.ghostAIs.set(ghosts[0].id, blinkyAI);
    this.ghostAIs.set(ghosts[1].id, pinkyAI);
    this.ghostAIs.set(ghosts[2].id, inkyAI);
    this.ghostAIs.set(ghosts[3].id, clydeAI);
  }

  update(deltaTime: number, ghosts: Ghost[], players: Player[]) {
    // Update mode timer
    this.modeTimer += deltaTime;

    const currentSequence = this.modeSequence[this.sequenceIndex];

    if (this.modeTimer >= currentSequence.duration) {
      this.modeTimer = 0;
      this.sequenceIndex = Math.min(
        this.sequenceIndex + 1,
        this.modeSequence.length - 1
      );
      this.currentMode = this.modeSequence[this.sequenceIndex].mode;
    }

    // Update each ghost
    const alivePlayers = players.filter(p => p.isAlive);

    for (const ghost of ghosts) {
      // Set mode (unless frightened or eaten)
      if (ghost.mode !== GhostMode.FRIGHTENED && ghost.mode !== GhostMode.EATEN) {
        ghost.mode = this.currentMode;
      }

      const ai = this.ghostAIs.get(ghost.id);
      if (ai) {
        ai.update(deltaTime, alivePlayers);
      }
    }
  }

  activateFrightenedMode(ghosts: Ghost[], duration: number = GAME_CONFIG.FRIGHTENED_DURATION) {
    for (const ghost of ghosts) {
      ghost.mode = GhostMode.FRIGHTENED;
      ghost.isVulnerable = true;

      // Set timer to end frightened mode
      setTimeout(() => {
        if (ghost.mode === GhostMode.FRIGHTENED) {
          ghost.mode = this.currentMode;
          ghost.isVulnerable = false;
        }
      }, duration);
    }
  }
}
