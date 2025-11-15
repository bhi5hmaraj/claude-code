// Game Room
// Built by NEXUS agent ⚡

import { Room, Client } from "@colyseus/core";
import { GameState, Player, Ghost } from "../schema/GameState";
import { GAME_CONFIG, GameStatus, Direction } from "../config/GameConstants";

interface PlayerStats {
  score: number;
  ghostsEaten: number;
  pelletsEaten: number;
  deaths: number;
  firstScoreTime: number | null;
}

interface DisconnectedPlayer {
  player: Player;
  disconnectTime: number;
  timeout: NodeJS.Timeout;
}

export class GameRoom extends Room<GameState> {
  private playerStats = new Map<string, PlayerStats>();
  private clientInputRates = new Map<string, number[]>();
  private disconnectedPlayers = new Map<string, DisconnectedPlayer>();
  private updateInterval?: NodeJS.Timeout;

  onCreate(options: any) {
    this.setState(new GameState());
    this.maxClients = GAME_CONFIG.MAX_PLAYERS;

    console.log("⚡ NEXUS: Game room created", this.roomId);

    // Set up message handlers
    this.onMessage("input", (client, message) => this.handleInput(client, message));
    this.onMessage("ready", (client) => this.handlePlayerReady(client));

    // Start game loop
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / GAME_CONFIG.TICK_RATE);
  }

  onJoin(client: Client, options: any) {
    console.log(`⚡ NEXUS: Player ${client.sessionId} joining...`);

    // Check for reconnection (Issue #1 from critique)
    if (this.disconnectedPlayers.has(client.sessionId)) {
      const data = this.disconnectedPlayers.get(client.sessionId)!;
      clearTimeout(data.timeout);
      this.disconnectedPlayers.delete(client.sessionId);

      console.log(`⚡ NEXUS: Player ${client.sessionId} reconnected`);

      client.send("reconnected", {
        sessionId: client.sessionId,
        timeDisconnected: Date.now() - data.disconnectTime
      });

      return;
    }

    // Create new player
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player${this.state.players.size + 1}`;

    // Assign spawn position (4 corners for 4 players)
    const spawnPositions = [
      { x: 1, y: 1 },     // Top-left
      { x: 26, y: 1 },    // Top-right
      { x: 1, y: 29 },    // Bottom-left
      { x: 26, y: 29 }    // Bottom-right
    ];

    const spawnIndex = this.state.players.size % 4;
    player.x = spawnPositions[spawnIndex].x;
    player.y = spawnPositions[spawnIndex].y;

    this.state.players.set(client.sessionId, player);

    // Initialize player stats (for tie-breaking - Issue #6)
    this.playerStats.set(client.sessionId, {
      score: 0,
      ghostsEaten: 0,
      pelletsEaten: 0,
      deaths: 0,
      firstScoreTime: null
    });

    console.log(`⚡ NEXUS: Player ${player.name} joined at (${player.x}, ${player.y})`);

    // Start game if enough players
    if (this.state.players.size === 2 && this.state.gameStatus === GameStatus.WAITING) {
      this.startGame();
    }
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (consented) {
      // Player quit intentionally - remove immediately
      console.log(`⚡ NEXUS: Player ${client.sessionId} left (consented)`);
      this.removePlayer(client.sessionId);
      return;
    }

    // Unintentional disconnect - give 30 seconds to reconnect (Issue #1)
    console.log(`⚡ NEXUS: Player ${client.sessionId} disconnected - 30s to reconnect`);

    const timeout = setTimeout(() => {
      console.log(`⚡ NEXUS: Player ${client.sessionId} reconnection timeout`);
      this.removePlayer(client.sessionId);
      this.disconnectedPlayers.delete(client.sessionId);
    }, GAME_CONFIG.RECONNECTION_TIMEOUT);

    this.disconnectedPlayers.set(client.sessionId, {
      player,
      disconnectTime: Date.now(),
      timeout
    });
  }

  private handleInput(client: Client, message: any) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.isAlive) return;

    // Validate direction (Issue #2 - Input validation)
    if (![0, 1, 2, 3].includes(message.direction)) {
      console.warn(`⚡ NEXUS: Invalid direction from ${client.sessionId}`);
      return;
    }

    // Rate limiting (Issue #5 - DDoS protection)
    if (!this.isInputRateLimited(client.sessionId)) {
      player.direction = message.direction;
      player.lastProcessedInput = message.timestamp || Date.now();
    }
  }

  private isInputRateLimited(sessionId: string): boolean {
    const now = Date.now();

    if (!this.clientInputRates.has(sessionId)) {
      this.clientInputRates.set(sessionId, []);
    }

    const timestamps = this.clientInputRates.get(sessionId)!;
    const recentInputs = timestamps.filter(t => now - t < 1000);

    if (recentInputs.length >= GAME_CONFIG.MAX_INPUT_RATE) {
      console.warn(`⚡ NEXUS: Rate limit exceeded for ${sessionId}`);
      return true;
    }

    recentInputs.push(now);
    this.clientInputRates.set(sessionId, recentInputs);
    return false;
  }

  private handlePlayerReady(client: Client) {
    console.log(`⚡ NEXUS: Player ${client.sessionId} ready`);
  }

  private startGame() {
    console.log("⚡ NEXUS: Starting game!");
    this.state.gameStatus = GameStatus.PLAYING;
    this.state.startTime = Date.now();
    this.state.timer = GAME_CONFIG.GAME_DURATION;

    // Will be implemented by other agents:
    // - PHANTOM will add maze initialization
    // - VOLT will add ghost initialization

    this.broadcast("gameStarted", { startTime: this.state.startTime });
  }

  private update(deltaTime: number) {
    if (this.state.gameStatus !== GameStatus.PLAYING) return;

    // Update timer
    const elapsed = (Date.now() - this.state.startTime) / 1000;
    this.state.timer = Math.max(0, GAME_CONFIG.GAME_DURATION - elapsed);

    if (this.state.timer === 0) {
      this.endGame();
      return;
    }

    // Player movement, collision, etc. will be implemented by other agents
  }

  private endGame() {
    this.state.gameStatus = GameStatus.ENDED;

    const rankings = this.calculateRankings();

    this.broadcast("gameOver", {
      rankings,
      winner: rankings[0]
    });

    console.log("⚡ NEXUS: Game ended!");
  }

  private calculateRankings() {
    // Tie-breaking system (Issue #6 from critique)
    const players = Array.from(this.state.players.values());

    return players.sort((a, b) => {
      // 1st: Highest score
      if (a.score !== b.score) return b.score - a.score;

      const statsA = this.playerStats.get(a.id)!;
      const statsB = this.playerStats.get(b.id)!;

      // 2nd: Most ghosts eaten
      if (statsA.ghostsEaten !== statsB.ghostsEaten) {
        return statsB.ghostsEaten - statsA.ghostsEaten;
      }

      // 3rd: Fewest deaths
      if (statsA.deaths !== statsB.deaths) {
        return statsA.deaths - statsB.deaths;
      }

      // 4th: First to score
      if (statsA.firstScoreTime && statsB.firstScoreTime) {
        return statsA.firstScoreTime - statsB.firstScoreTime;
      }

      return 0;
    });
  }

  private removePlayer(sessionId: string) {
    this.state.players.delete(sessionId);
    this.playerStats.delete(sessionId);
    this.clientInputRates.delete(sessionId);
    this.broadcast("playerLeft", { sessionId });
  }

  onDispose() {
    console.log("⚡ NEXUS: Room disposed", this.roomId);
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Clear all reconnection timeouts
    this.disconnectedPlayers.forEach(data => clearTimeout(data.timeout));
  }
}
