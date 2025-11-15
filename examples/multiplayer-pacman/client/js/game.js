// Multiplayer Pac-Man Client
// Built by BUILDER agent 🔨

class PacManClient {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.status = document.getElementById('status');

    this.client = null;
    this.room = null;
    this.sessionId = null;

    this.localPlayer = null;
    this.inputBuffer = [];
    this.nextSequence = 0;

    this.init();
  }

  async init() {
    try {
      // Connect to Colyseus server
      const serverUrl = window.location.protocol.replace('http', 'ws') +
                        '//' + window.location.hostname + ':2567';

      this.client = new Colyseus.Client(serverUrl);

      this.status.textContent = 'Joining game room...';

      // Join or create room
      this.room = await this.client.joinOrCreate('game_room');

      this.sessionId = this.room.sessionId;
      this.status.textContent = `Connected! Session: ${this.sessionId}`;

      // Set up event handlers
      this.setupEventHandlers();

      // Set up input
      this.setupInput();

      // Start game loop
      this.gameLoop();

    } catch (error) {
      console.error('Connection error:', error);
      this.status.textContent = `Connection failed: ${error.message}`;
    }
  }

  setupEventHandlers() {
    // State change listener
    this.room.onStateChange((state) => {
      this.onStateUpdate(state);
    });

    // Message listeners
    this.room.onMessage('reconnected', (data) => {
      console.log('Reconnected successfully!', data);
      this.status.textContent = 'Reconnected!';
    });

    this.room.onMessage('gameOver', (data) => {
      console.log('Game over!', data);
      this.status.textContent = `Game Over! Winner: ${data.winner.playerName}`;
    });

    // Connection error
    this.room.onError((code, message) => {
      console.error('Room error:', code, message);
      this.status.textContent = `Error: ${message}`;
    });

    // Leave handler
    this.room.onLeave((code) => {
      console.log('Left room:', code);
      this.status.textContent = 'Disconnected from server';
    });
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      let direction = null;

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 0; // UP
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 1; // RIGHT
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 2; // DOWN
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 3; // LEFT
          break;
      }

      if (direction !== null) {
        e.preventDefault();
        this.sendInput(direction);
      }
    });
  }

  sendInput(direction) {
    const input = {
      direction,
      timestamp: Date.now(),
      sequenceNumber: this.nextSequence++
    };

    // Send to server
    this.room.send('input', input);

    // Store for client-side prediction
    this.inputBuffer.push(input);
  }

  onStateUpdate(state) {
    // Will be implemented with state rendering
    // For now, just store the state
    this.gameState = state;
  }

  gameLoop() {
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState) {
      // Show waiting message
      this.ctx.fillStyle = '#ff0';
      this.ctx.font = '24px "Courier New"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Waiting for game state...',
                        this.canvas.width / 2,
                        this.canvas.height / 2);
      return;
    }

    // TODO: Render maze, players, ghosts, pellets
    // Will be implemented by rendering agent

    // Placeholder rendering
    this.ctx.fillStyle = '#ff0';
    this.ctx.font = '16px "Courier New"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game scaffolding ready!',
                      this.canvas.width / 2,
                      this.canvas.height / 2);
    this.ctx.fillText('Rendering system coming soon...',
                      this.canvas.width / 2,
                      this.canvas.height / 2 + 30);
  }
}

// Start game when page loads
window.addEventListener('load', () => {
  new PacManClient();
});
