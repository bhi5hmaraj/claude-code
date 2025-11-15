// Game Constants
// Built by NEXUS agent ⚡

export const GAME_CONFIG = {
  // Grid configuration
  GRID_WIDTH: 28,
  GRID_HEIGHT: 31,
  TILE_SIZE: 1, // 1 unit per tile

  // Game timing
  TICK_RATE: 20, // 20 Hz (50ms per tick)
  GAME_DURATION: 180, // 3 minutes in seconds

  // Player configuration
  MAX_PLAYERS: 4,
  PLAYER_SPEED: 4, // tiles per second
  PLAYER_LIVES: 3,
  SPAWN_INVINCIBILITY: 3000, // 3 seconds in milliseconds

  // Ghost configuration
  GHOST_COUNT: 4,
  GHOST_SPEED: 3.5, // tiles per second
  FRIGHTENED_DURATION: 10000, // 10 seconds
  SCATTER_DURATION: 7000, // 7 seconds
  CHASE_DURATION: 20000, // 20 seconds

  // Collision radii (Issue #3 from critique - fixed to 0.5)
  COLLISION_RADII: {
    PLAYER: 0.5,
    GHOST: 0.5, // Fixed from 0.3 to 0.5
    PELLET: 0.5,
    WALL_BUFFER: 0.4
  },

  // Scoring
  POINTS: {
    NORMAL_PELLET: 10,
    POWER_PELLET: 50,
    GHOST_1ST: 200,
    GHOST_2ND: 400,
    GHOST_3RD: 800,
    GHOST_4TH: 1600
  },

  // Network
  RECONNECTION_TIMEOUT: 30000, // 30 seconds (Issue #1 from critique)
  MAX_INPUT_RATE: 100, // Max 100 inputs per second per client
  STATE_UPDATE_RATE: 20 // 20 Hz
};

export enum GameStatus {
  WAITING = 0,
  PLAYING = 1,
  ENDED = 2
}

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3
}

export enum GhostMode {
  SCATTER = 0,
  CHASE = 1,
  FRIGHTENED = 2,
  EATEN = 3
}
