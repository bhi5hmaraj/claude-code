# Multiplayer Pac-Man

Real-time multiplayer Pac-Man game built with Colyseus, TypeScript, and HTML5 Canvas.

**Built by Multi-Agent System:**
- 🏛️ **ARCHITECT** - Design and architecture
- 🔨 **BUILDER** - Project scaffolding
- 📜 **SCRIBE** - Documentation

## 🎮 Features

- 4-player multiplayer support
- Real-time synchronization
- 4 different ghost AI behaviors
- Client-side prediction with lag compensation
- Reconnection support (30-second window)
- Server-authoritative gameplay
- DDoS protection

## 📁 Project Structure

```
multiplayer-pacman/
├── server/                 # Colyseus backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── rooms/         # Game rooms
│   │   ├── schema/        # State schemas
│   │   ├── ai/            # Ghost AI
│   │   ├── utils/         # Utilities (maze, collision)
│   │   └── config/        # Configuration
│   ├── package.json
│   └── tsconfig.json
├── client/                 # HTML5 Canvas frontend
│   ├── index.html
│   ├── js/
│   │   └── game.js        # Game client
│   └── assets/            # Sounds, sprites
├── DESIGN_ITERATION_1.md  # Initial design
├── CRITIQUE_ITERATION_1.md # Design critique
├── DESIGN_ITERATION_2.md  # Refined design
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install server dependencies
cd server
npm install

# Build TypeScript
npm run build
```

### Running the Server

```bash
# Development mode (auto-reload)
cd server
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:2567`

### Running the Client

```bash
# Serve client files (use any static server)
cd client
python3 -m http.server 8000

# Or use npx
npx http-server -p 8000
```

Client will be available at `http://localhost:8000`

## 🎯 How to Play

1. Open `http://localhost:8000` in your browser
2. The game will automatically connect to the server
3. Use **Arrow Keys** or **WASD** to move
4. Collect all pellets to win
5. Eat power pellets to make ghosts vulnerable
6. Eat ghosts for bonus points (200, 400, 800, 1600)

## 🏗️ Development Status

- ✅ Design iteration complete
- ✅ Project scaffolding complete
- ⏳ Server implementation (coming soon)
- ⏳ Game logic (coming soon)
- ⏳ Rendering system (coming soon)

## 📖 Documentation

- [Design Iteration 1](./DESIGN_ITERATION_1.md)
- [Critique Iteration 1](./CRITIQUE_ITERATION_1.md)
- [Design Iteration 2](./DESIGN_ITERATION_2.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) (coming soon)

## 🤝 Multi-Agent Development

This project was built using a multi-agent orchestration system powered by **Beads**:

- **ARCHITECT** designed the system architecture
- **BUILDER** set up the project structure
- **SCRIBE** created documentation

## 📝 License

MIT

---

**Status:** MVP in development 🚧
