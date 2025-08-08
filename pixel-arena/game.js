const ARENA = { w: 900, h: 600 };
const PLAYER = { speed: 240 /* px/s */, size: 16 };
const COIN = { r: 9, count: 12 };
const ROUND_DURATION = 60; // seconds

let players = new Map(); // id -> { id, name, x, y, score, inputs }
let coins = []; // { x, y }
let roundEndsAt = Date.now() + ROUND_DURATION * 1000;

function rand(min, max) { return Math.random() * (max - min) + min; }
function spawnCoin() {
  coins.push({
    x: Math.round(rand(40, ARENA.w - 40)),
    y: Math.round(rand(40, ARENA.h - 40))
  });
}
function ensureCoins() {
  while (coins.length < COIN.count) spawnCoin();
}

function resetRound() {
  // soft reset scores but keep connections
  for (const p of players.values()) {
    p.score = 0;
    p.x = Math.round(rand(40, ARENA.w - 40));
    p.y = Math.round(rand(40, ARENA.h - 40));
  }
  coins = [];
  ensureCoins();
  roundEndsAt = Date.now() + ROUND_DURATION * 1000;
}

function step(dt, broadcast = () => {}) {
  // Update positions
  for (const p of players.values()) {
    const { up, down, left, right } = p.inputs || {};
    let vx = 0, vy = 0;
    if (left) vx -= 1; if (right) vx += 1;
    if (up) vy -= 1; if (down) vy += 1;
    if (vx || vy) {
      const len = Math.hypot(vx, vy) || 1;
      vx /= len; vy /= len;
      p.x += vx * PLAYER.speed * dt;
      p.y += vy * PLAYER.speed * dt;
      // clamp
      p.x = Math.max(PLAYER.size, Math.min(ARENA.w - PLAYER.size, p.x));
      p.y = Math.max(PLAYER.size, Math.min(ARENA.h - PLAYER.size, p.y));
    }
  }

  // Collisions with coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    for (const p of players.values()) {
      const dist = Math.hypot(p.x - c.x, p.y - c.y);
      if (dist < PLAYER.size + COIN.r) {
        p.score++;
        coins.splice(i, 1);
        spawnCoin();
        break;
      }
    }
  }

  // Round timing
  const now = Date.now();
  if (now >= roundEndsAt) {
    // emit end event
    broadcast({ type: 'round_end', leaderboard: leaderboard(), inMs: 3000 });
    // schedule reset after short pause
    roundEndsAt = now + 3600 * 1000; // temporarily push far so we don't repeat
    setTimeout(() => {
      resetRound();
      broadcast({ type: 'round_start', endsAt: roundEndsAt });
    }, 3000);
  }
}

function publicState() {
  return {
    type: 'state',
    arena: ARENA,
    coins,
    players: Array.from(players.values()).map(p => ({ id: p.id, name: p.name, x: Math.round(p.x), y: Math.round(p.y), score: p.score })),
    endsAt: roundEndsAt
  };
}

function leaderboard() {
  return Array.from(players.values())
    .map(p => ({ id: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

export {
  ARENA,
  PLAYER,
  COIN,
  players,
  coins,
  roundEndsAt,
  rand,
  ensureCoins,
  resetRound,
  step,
  publicState,
  leaderboard
};
