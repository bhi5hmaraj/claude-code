// Game State Schemas
// Built by NEXUS agent ⚡

import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") direction: number = 1; // Direction.RIGHT
  @type("number") score: number = 0;
  @type("number") lives: number = 3;
  @type("boolean") isPoweredUp: boolean = false;
  @type("number") powerUpEndTime: number = 0;
  @type("boolean") isAlive: boolean = true;
  @type("number") lastProcessedInput: number = 0; // For client prediction
}

export class Ghost extends Schema {
  @type("string") id: string;
  @type("string") name: string; // "Blinky", "Pinky", "Inky", "Clyde"
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") mode: number = 0; // GhostMode enum
  @type("number") targetX: number = 0;
  @type("number") targetY: number = 0;
  @type("boolean") isVulnerable: boolean = false;
  @type("number") color: number = 0; // 0=red, 1=pink, 2=cyan, 3=orange
}

export class Pellet extends Schema {
  @type("string") id: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("boolean") isPowerPellet: boolean = false;
}

export class Tile extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("boolean") isWall: boolean = false;
  @type("boolean") isGhostSpawn: boolean = false;
  @type("boolean") isPlayerSpawn: boolean = false;
}

export class GameState extends Schema {
  @type("number") gameStatus: number = 0; // GameStatus enum
  @type("number") timer: number = 180; // seconds remaining
  @type("number") startTime: number = 0;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type([Ghost]) ghosts = new ArraySchema<Ghost>();
  @type({ map: Pellet }) pellets = new MapSchema<Pellet>();

  // Maze representation (simplified - actual maze handled by utility)
  @type("number") mazeWidth: number = 28;
  @type("number") mazeHeight: number = 31;

  @type("number") pelletsRemaining: number = 0;
}
