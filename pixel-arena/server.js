
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { customAlphabet } from 'nanoid';
import {
  ARENA,
  players,
  roundEndsAt,
  rand,
  ensureCoins,
  resetRound,
  step,
  publicState,
  leaderboard
} from './game.js';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// ----- Game State -----
const TICK_RATE = 30; // server ticks per second

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

wss.on('connection', (ws) => {
  let me = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const id = nanoid();
      const name = String(msg.name || 'Player').slice(0, 12);
      me = { id, name, x: rand(40, ARENA.w - 40), y: rand(40, ARENA.h - 40), score: 0, inputs: {} };
      players.set(id, me);
      ws.send(JSON.stringify({ type: 'welcome', id, endsAt: roundEndsAt }));
      ensureCoins();
      return;
    }

    if (msg.type === 'inputs' && me) {
      me.inputs = msg.inputs || {};
      return;
    }
  });

  ws.on('close', () => {
    if (me) players.delete(me.id);
  });
});

// Main loop
let last = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - last) / 1000;
  last = now;
  step(dt, broadcast);
  broadcast(publicState());
}, 1000 / TICK_RATE);

// Start first round
resetRound();

server.listen(PORT, () => {
  console.log(`Pixel Arena live on http://localhost:${PORT}`);
});
