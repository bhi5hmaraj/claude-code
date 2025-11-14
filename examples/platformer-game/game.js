/**
 * Multi-Agent Platformer Game
 * Built using Beads multi-agent orchestration
 * Each section built by a different "agent"
 */

// =============================================================================
// AGENT: Engine Developer (claude-1.1)
// Core game engine with canvas and game loop
// =============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const game = {
    running: false,
    lastTime: 0,
    deltaTime: 0,
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0
};

// Initialize game
function init() {
    console.log('🎮 [Agent: Engine] Initializing game engine...');
    game.running = true;
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(currentTime) {
    if (!game.running) return;

    // Calculate delta time (time since last frame)
    game.deltaTime = (currentTime - game.lastTime) / 1000; // Convert to seconds
    game.lastTime = currentTime;

    // Cap delta time to prevent spiral of death
    if (game.deltaTime > 0.1) game.deltaTime = 0.1;

    // Update FPS counter
    game.frameCount++;
    if (currentTime - game.lastFpsUpdate > 1000) {
        game.fps = game.frameCount;
        game.frameCount = 0;
        game.lastFpsUpdate = currentTime;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state (will be implemented by other agents)
    update(game.deltaTime);

    // Render game (will be implemented by other agents)
    render(ctx);

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Placeholder functions (to be implemented by other agents)
function update(dt) {
    // Physics, player, input updates will go here
}

function render(ctx) {
    // Rendering code will go here
    // For now, just show a message
    ctx.fillStyle = '#333';
    ctx.font = '20px Courier New';
    ctx.fillText('🎮 Game Engine Running...', 250, 300);
    ctx.fillText(`FPS: ${game.fps}`, 20, 30);
}

// Start the game when page loads
console.log('✅ [Agent: Engine] Game engine core ready!');
// Game will be started by the final integration step
