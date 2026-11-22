import { describe, expect, it } from 'vitest';
import {
  DIFFICULTIES,
  createGame,
  queueDirection,
  spawnFood,
  speedLevel,
  start,
  step,
  togglePause,
} from './engine';
import type { GameState, Point } from './types';

const config = DIFFICULTIES.normal;
const rngZero = () => 0;

/** A running game with a hand-placed snake and food. */
function game(snake: Point[], food: Point | null, overrides: Partial<GameState> = {}): GameState {
  return {
    ...createGame(config, rngZero),
    snake,
    prevSnake: snake,
    food,
    status: 'running',
    ...overrides,
  };
}

describe('createGame', () => {
  it('places a snake of the initial length facing right in the middle', () => {
    const s = createGame(config, rngZero);
    expect(s.snake).toHaveLength(config.initialLength);
    expect(s.snake[0]).toEqual({ x: 7, y: 7 });
    expect(s.snake[1]).toEqual({ x: 6, y: 7 });
    expect(s.direction).toBe('right');
    expect(s.status).toBe('ready');
  });

  it('never spawns the first food on the snake', () => {
    for (let i = 0; i < 50; i++) {
      const s = createGame(config);
      expect(s.snake.some((p) => p.x === s.food!.x && p.y === s.food!.y)).toBe(false);
    }
  });
});

describe('spawnFood', () => {
  it('only ever returns free cells', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    for (const r of [0, 0.25, 0.5, 0.999999]) {
      const f = spawnFood(snake, 3, () => r)!;
      expect(f.y).toBeGreaterThan(0);
    }
  });

  it('returns the single remaining cell on an almost-full board', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    expect(spawnFood(snake, 2, () => 0.9)).toEqual({ x: 0, y: 1 });
  });

  it('returns null when the board is full', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(spawnFood(snake, 2, Math.random)).toBeNull();
  });
});

describe('movement', () => {
  it('moves one cell per step in the current direction and keeps its length', () => {
    const s = step(game([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], { x: 0, y: 0 }));
    expect(s.snake).toEqual([
      { x: 6, y: 5 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ]);
    expect(s.prevSnake[0]).toEqual({ x: 5, y: 5 });
  });

  it('applies queued turns one per tick', () => {
    let s = game([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], { x: 0, y: 0 });
    s = queueDirection(s, 'up');
    s = queueDirection(s, 'left');
    expect(s.queue).toEqual(['up', 'left']);
    s = step(s);
    expect(s.snake[0]).toEqual({ x: 5, y: 4 });
    s = step(s);
    expect(s.snake[0]).toEqual({ x: 4, y: 4 });
    expect(s.status).toBe('running');
  });

  it('does nothing unless running', () => {
    const ready = createGame(config, rngZero);
    expect(step(ready)).toBe(ready);
    const paused = togglePause(start(ready));
    expect(paused.status).toBe('paused');
    expect(step(paused)).toBe(paused);
  });
});

describe('reversal guard', () => {
  const base = () => game([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], { x: 0, y: 0 });

  it('ignores a direct reversal', () => {
    const s = base();
    expect(queueDirection(s, 'left')).toBe(s);
  });

  it('ignores repeating the current direction', () => {
    const s = base();
    expect(queueDirection(s, 'right')).toBe(s);
  });

  it('validates against the last queued turn, so a fast up→down cannot fold back', () => {
    let s = queueDirection(base(), 'up');
    s = queueDirection(s, 'down');
    expect(s.queue).toEqual(['up']);
  });

  it('survives a rapid up→left double tap while moving right', () => {
    let s = queueDirection(base(), 'up');
    s = queueDirection(s, 'left');
    s = step(step(s));
    expect(s.status).toBe('running');
  });

  it('caps the buffer at two turns', () => {
    let s = queueDirection(base(), 'up');
    s = queueDirection(s, 'left');
    s = queueDirection(s, 'down');
    expect(s.queue).toHaveLength(2);
  });
});

describe('eating and growth', () => {
  it('grows by one, scores, speeds up and respawns food off the snake', () => {
    const s0 = game([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], { x: 6, y: 5 });
    const s1 = step(s0, rngZero);
    expect(s1.snake).toHaveLength(4);
    expect(s1.snake[0]).toEqual({ x: 6, y: 5 });
    expect(s1.snake[3]).toEqual({ x: 3, y: 5 });
    expect(s1.score).toBe(1);
    expect(s1.foodSerial).toBe(1);
    expect(s1.tickMs).toBe(config.startTickMs - config.speedStepMs);
    expect(s1.food).not.toBeNull();
    expect(s1.snake.some((p) => p.x === s1.food!.x && p.y === s1.food!.y)).toBe(false);
  });

  it('never drops below the minimum tick', () => {
    const s = step(
      game([{ x: 5, y: 5 }, { x: 4, y: 5 }], { x: 6, y: 5 }, { tickMs: config.minTickMs }),
      rngZero,
    );
    expect(s.tickMs).toBe(config.minTickMs);
  });

  it('reports a higher speed level as the tick shrinks', () => {
    const s = game([{ x: 5, y: 5 }], null);
    expect(speedLevel(s)).toBe(1);
    expect(speedLevel({ ...s, tickMs: config.startTickMs - config.speedStepMs * 3 })).toBe(2);
  });

  it('wins when the last free cell is eaten', () => {
    const cfg = { ...config, gridSize: 2 };
    const s = step(
      game([{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }], { x: 1, y: 1 }, {
        config: cfg,
        direction: 'right',
      }),
    );
    expect(s.status).toBe('won');
    expect(s.food).toBeNull();
    expect(s.snake).toHaveLength(4);
  });
});

describe('collisions', () => {
  it.each([
    ['right', { x: 14, y: 5 }],
    ['left', { x: 0, y: 5 }],
    ['up', { x: 5, y: 0 }],
    ['down', { x: 5, y: 14 }],
  ] as const)('ends the game when hitting the %s wall', (direction, head) => {
    const s = step(game([head], null, { direction }));
    expect(s.status).toBe('over');
    expect(s.deathCause).toBe('wall');
    expect(s.snake[0]).toEqual(head);
  });

  it('ends the game when the head runs into the body', () => {
    // A hook shape: moving up from (2,2) lands on (2,1), which is body.
    const snake = [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ];
    const s = step(game(snake, null, { direction: 'left', queue: ['up'] }));
    expect(s.status).toBe('over');
    expect(s.deathCause).toBe('self');
  });

  it('allows moving into the cell the tail is leaving', () => {
    // 2x2 loop: head chases its own tail.
    const snake = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ];
    const s = step(game(snake, null, { direction: 'down' }));
    expect(s.status).toBe('running');
    expect(s.snake[0]).toEqual({ x: 1, y: 2 });
  });

  it('does not allow moving into the tail cell on a tick where the snake grows', () => {
    const snake = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ];
    // Food sits under the tail, so the tail stays put this tick.
    const s = step(game(snake, { x: 1, y: 2 }, { direction: 'down' }));
    expect(s.status).toBe('over');
    expect(s.deathCause).toBe('self');
  });

  it('ignores input after game over', () => {
    const over = step(game([{ x: 14, y: 5 }], null));
    expect(queueDirection(over, 'up')).toBe(over);
    expect(togglePause(over)).toBe(over);
  });
});
