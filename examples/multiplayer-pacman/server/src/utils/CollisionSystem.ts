// Collision Detection System
// Built by PHANTOM agent 👻

import { Player, Ghost, Pellet } from "../schema/GameState";
import { Maze } from "./Maze";
import { GAME_CONFIG } from "../config/GameConstants";

export class CollisionSystem {
  private maze: Maze;

  constructor(maze: Maze) {
    this.maze = maze;
  }

  // Check player collision with walls
  checkPlayerWallCollision(player: Player, dx: number, dy: number): boolean {
    const nextX = player.x + dx;
    const nextY = player.y + dy;

    return this.maze.checkWallCollision(
      nextX,
      nextY,
      GAME_CONFIG.COLLISION_RADII.PLAYER
    );
  }

  // Check ghost collision with walls
  checkGhostWallCollision(ghost: Ghost, dx: number, dy: number): boolean {
    const nextX = ghost.x + dx;
    const nextY = ghost.y + dy;

    return this.maze.checkWallCollision(
      nextX,
      nextY,
      GAME_CONFIG.COLLISION_RADII.GHOST
    );
  }

  // Check player-ghost collision (Issue #3 - Fixed radius to 0.5)
  checkPlayerGhostCollision(player: Player, ghost: Ghost): boolean {
    const distance = Math.sqrt(
      Math.pow(player.x - ghost.x, 2) +
      Math.pow(player.y - ghost.y, 2)
    );

    const combinedRadius = GAME_CONFIG.COLLISION_RADII.PLAYER +
                           GAME_CONFIG.COLLISION_RADII.GHOST;

    return distance < combinedRadius;
  }

  // Check player-pellet collision (Issue #2 - Server-side validation)
  checkPlayerPelletCollision(player: Player, pellet: Pellet): boolean {
    const distance = Math.sqrt(
      Math.pow(player.x - pellet.x, 2) +
      Math.pow(player.y - pellet.y, 2)
    );

    return distance < GAME_CONFIG.COLLISION_RADII.PELLET;
  }

  // Check if position is valid (not in wall)
  isValidPosition(x: number, y: number, radius: number): boolean {
    return !this.maze.checkWallCollision(x, y, radius);
  }
}
