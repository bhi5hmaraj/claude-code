// Multiplayer Pac-Man Server
// Built by NEXUS agent ⚡

import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import express from "express";
import rateLimit from "express-rate-limit";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Rate limiting middleware (DDoS protection - Issue #5 from critique)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: "Too many requests from this IP, please try again later."
});

app.use("/matchmake", limiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: app.listen(port)
  })
});

// Register game room
gameServer.define("game_room", GameRoom);

// Register Colyseus monitor (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use("/colyseus", monitor());
}

console.log(`⚡ NEXUS: Colyseus server listening on ws://localhost:${port}`);
console.log(`⚡ NEXUS: Monitor available at http://localhost:${port}/colyseus`);
