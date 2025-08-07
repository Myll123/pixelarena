
let ws; let myId = null; let endsAt = null;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const joinBtn = document.getElementById('join');
const nameInput = document.getElementById('name');
const timerEl = document.getElementById('timer');
const boardEl = document.getElementById('board');

const KEYS = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', z:'up', s:'down', q:'left', d:'right' };
const inputs = { up:false, down:false, left:false, right:false };

let world = { arena:{ w:900, h:600 }, coins:[], players:[] };

function connect() {
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${loc.host}`);

  ws.addEventListener('open', () => {
    const name = nameInput.value.trim() || 'Player';
    ws.send(JSON.stringify({ type:'join', name }));
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'welcome') { myId = msg.id; endsAt = msg.endsAt; }
    if (msg.type === 'state') { world = msg; if (!endsAt) endsAt = msg.endsAt; }
    if (msg.type === 'round_end') { endsAt = Date.now() + msg.inMs; }
    if (msg.type === 'round_start') { endsAt = msg.endsAt; }
  });

  ws.addEventListener('close', () => {
    setTimeout(connect, 1000); // simple auto-retry
  });
}

joinBtn.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) connect();
});

window.addEventListener('keydown', (e) => {
  const k = KEYS[e.key]; if (!k) return; inputs[k] = true; sendInputs();
});
window.addEventListener('keyup', (e) => {
  const k = KEYS[e.key]; if (!k) return; inputs[k] = false; sendInputs();
});

function sendInputs() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type:'inputs', inputs }));
  }
}

function draw() {
  const { arena, coins, players } = world;
  // bg grid
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0,0,arena.w,arena.h);
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#55c2f6';
  for (let x=0; x<arena.w; x+=30) ctx.fillRect(x,0,1,arena.h);
  for (let y=0; y<arena.h; y+=30) ctx.fillRect(0,y,arena.w,1);
  ctx.globalAlpha = 1;

  // coins
  for (const c of coins) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI*2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
  }

  // players
  for (const p of players) {
    const me = p.id === myId;
    ctx.fillStyle = me ? '#55c2f6' : '#7bd88f';
    const sz = 16;
    ctx.fillRect(p.x - sz, p.y - sz, sz*2, sz*2);
    // name
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, p.x, p.y - 20);
  }

  // HUD timer
  if (endsAt) {
    const left = Math.max(0, endsAt - Date.now());
    const sec = Math.floor(left / 1000);
    timerEl.textContent = `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  }

  // leaderboard
  const sorted = [...players].sort((a,b)=>b.score-a.score);
  boardEl.innerHTML = '';
  sorted.forEach((p,i)=>{
    const row = document.createElement('div');
    row.innerHTML = `<span class="badge">${i+1}.</span> ${p.name} — ${p.score}`;
    boardEl.appendChild(row);
  });

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
