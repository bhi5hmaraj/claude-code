// A* Pathfinding Algorithm
// Built by VOLT agent 🔮

import { Maze } from "./Maze";

interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: Node | null;
}

export class Pathfinding {
  private maze: Maze;

  constructor(maze: Maze) {
    this.maze = maze;
  }

  // A* algorithm implementation
  findPath(start: { x: number, y: number }, goal: { x: number, y: number }): { x: number, y: number }[] {
    const startNode: Node = {
      x: Math.floor(start.x),
      y: Math.floor(start.y),
      g: 0,
      h: this.heuristic(start, goal),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;

    const goalNode = {
      x: Math.floor(goal.x),
      y: Math.floor(goal.y)
    };

    const openSet: Node[] = [startNode];
    const closedSet: Set<string> = new Set();

    while (openSet.length > 0) {
      // Get node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];

      // Check if we reached the goal
      if (current.x === goalNode.x && current.y === goalNode.y) {
        return this.reconstructPath(current);
      }

      // Move current from open to closed
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      // Check neighbors
      const neighbors = this.maze.getNeighbors(current.x, current.y);

      for (const neighborPos of neighbors) {
        const key = `${neighborPos.x},${neighborPos.y}`;

        if (closedSet.has(key)) continue;

        const tentativeG = current.g + 1;

        // Check if neighbor is in open set
        let neighborNode = openSet.find(n => n.x === neighborPos.x && n.y === neighborPos.y);

        if (!neighborNode) {
          neighborNode = {
            x: neighborPos.x,
            y: neighborPos.y,
            g: tentativeG,
            h: this.heuristic(neighborPos, goalNode),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openSet.push(neighborNode);
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    // No path found - return empty array
    return [];
  }

  // Manhattan distance heuristic
  private heuristic(a: { x: number, y: number }, b: { x: number, y: number }): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  // Reconstruct path from goal to start
  private reconstructPath(node: Node): { x: number, y: number }[] {
    const path: { x: number, y: number }[] = [];
    let current: Node | null = node;

    while (current !== null) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  // Get next move direction from current position to target
  getNextDirection(current: { x: number, y: number }, target: { x: number, y: number }): number {
    const path = this.findPath(current, target);

    if (path.length < 2) {
      return -1; // No path or already at target
    }

    const next = path[1]; // Skip current position
    const dx = next.x - Math.floor(current.x);
    const dy = next.y - Math.floor(current.y);

    // Convert to direction enum
    if (dy < 0) return 0; // UP
    if (dx > 0) return 1; // RIGHT
    if (dy > 0) return 2; // DOWN
    if (dx < 0) return 3; // LEFT

    return -1;
  }
}
