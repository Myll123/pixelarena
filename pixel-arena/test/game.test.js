import { jest } from '@jest/globals';

let step, players, coins, PLAYER;
beforeAll(async () => {
  ({ step, players, coins, PLAYER } = await import('../game.js'));
});

beforeEach(() => {
  players.clear();
  coins.length = 0;
});

test('moves player based on inputs', () => {
  players.set('p1', { x: 100, y: 100, score: 0, inputs: { right: true } });
  step(1);
  const p = players.get('p1');
  expect(p.x).toBeCloseTo(100 + PLAYER.speed);
  expect(p.y).toBe(100);
});

test('collecting a coin increases score and respawns coin', () => {
  const coin = { x: 50, y: 50 };
  coins.push(coin);
  players.set('p1', { x: 50, y: 50, score: 0, inputs: {} });
  step(0);
  const p = players.get('p1');
  expect(p.score).toBe(1);
  expect(coins.length).toBe(1);
  expect(coins[0]).not.toBe(coin);
});
