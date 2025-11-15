// Maze System
// Built by PHANTOM agent 👻

import { GAME_CONFIG } from "../config/GameConstants";

export class Maze {
  private width: number;
  private height: number;
  private walls: boolean[][];
  private pelletPositions: { x: number, y: number, isPower: boolean }[];
  private playerSpawns: { x: number, y: number }[];
  private ghostSpawn: { x: number, y: number };

  constructor() {
    this.width = GAME_CONFIG.GRID_WIDTH;
    this.height = GAME_CONFIG.GRID_HEIGHT;
    this.walls = [];
    this.pelletPositions = [];
    this.playerSpawns = [
      { x: 1, y: 1 },
      { x: 26, y: 1 },
      { x: 1, y: 29 },
      { x: 26, y: 29 }
    ];
    this.ghostSpawn = { x: 14, y: 15 }; // Center

    this.generateMaze();
  }

  private generateMaze() {
    // Initialize grid
    this.walls = Array(this.height).fill(null).map(() =>
      Array(this.width).fill(false)
    );

    // Create classic Pac-Man style maze (simplified)
    // Border walls
    for (let x = 0; x < this.width; x++) {
      this.walls[0][x] = true; // Top wall
      this.walls[this.height - 1][x] = true; // Bottom wall
    }
    for (let y = 0; y < this.height; y++) {
      this.walls[y][0] = true; // Left wall
      this.walls[y][this.width - 1] = true; // Right wall
    }

    // Internal walls (creating corridors)
    this.addInternalWalls();

    // Generate pellet positions
    this.generatePellets();
  }

  private addInternalWalls() {
    // Vertical walls
    for (let y = 2; y < this.height - 2; y += 4) {
      for (let x = 3; x < this.width - 3; x += 6) {
        this.walls[y][x] = true;
        if (y + 1 < this.height) this.walls[y + 1][x] = true;
      }
    }

    // Horizontal walls
    for (let y = 4; y < this.height - 4; y += 6) {
      for (let x = 2; x < this.width - 2; x += 5) {
        this.walls[y][x] = true;
        if (x + 1 < this.width) this.walls[y][x + 1] = true;
      }
    }

    // Ghost house (center area)
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x > 0 && x < this.width && y > 0 && y < this.height) {
          // Ghost house border
          if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
            this.walls[y][x] = true;
          }
        }
      }
    }
  }

  private generatePellets() {
    // Place pellets in all non-wall tiles
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (!this.walls[y][x]) {
          // Skip player spawn areas
          const isSpawn = this.playerSpawns.some(spawn =>
            Math.abs(spawn.x - x) < 2 && Math.abs(spawn.y - y) < 2
          );

          // Skip ghost spawn area
          const isGhostSpawn = Math.abs(this.ghostSpawn.x - x) < 3 &&
                               Math.abs(this.ghostSpawn.y - y) < 3;

          if (!isSpawn && !isGhostSpawn) {
            // Power pellets in corners
            const isPower = (x < 4 && y < 4) ||
                           (x > this.width - 5 && y < 4) ||
                           (x < 4 && y > this.height - 5) ||
                           (x > this.width - 5 && y > this.height - 5);

            this.pelletPositions.push({ x, y, isPower });
          }
        }
      }
    }
  }

  // Wall collision check
  isWall(x: number, y: number): boolean {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return true; // Out of bounds = wall
    }

    return this.walls[gridY][gridX];
  }

  // AABB collision detection for player/ghost with walls
  checkWallCollision(x: number, y: number, radius: number): boolean {
    // Check all 4 corners of bounding box
    const corners = [
      { x: x - radius, y: y - radius }, // Top-left
      { x: x + radius, y: y - radius }, // Top-right
      { x: x - radius, y: y + radius }, // Bottom-left
      { x: x + radius, y: y + radius }  // Bottom-right
    ];

    return corners.some(corner => this.isWall(corner.x, corner.y));
  }

  // Get valid neighbor tiles for pathfinding (A*)
  getNeighbors(x: number, y: number): { x: number, y: number }[] {
    const neighbors: { x: number, y: number }[] = [];
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }  // Left
    ];

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (!this.isWall(newX, newY)) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  // Getters
  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getPelletPositions(): { x: number, y: number, isPower: boolean }[] {
    return this.pelletPositions;
  }

  getPlayerSpawns(): { x: number, y: number }[] {
    return this.playerSpawns;
  }

  getGhostSpawn(): { x: number, y: number } {
    return this.ghostSpawn;
  }

  // Export maze as 2D array for rendering
  exportMaze(): boolean[][] {
    return this.walls.map(row => [...row]); // Deep copy
  }
}
