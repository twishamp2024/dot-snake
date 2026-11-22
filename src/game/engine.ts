/**
 * Pure, framework-free Snake rules. Every function takes a state and returns a
 * new one, so the engine can be unit-tested without a DOM, a clock or React.
 */
import type { Direction, GameConfig, GameState, Point, Rng } from './types';

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** At most this many inputs are buffered between ticks. */
export const MAX_QUEUED_TURNS = 2;

export type Difficulty = 'easy' | 'normal' | 'hard';

const BASE_CONFIG = { gridSize: 15, initialLength: 3 } as const;

export const DIFFICULTIES: Record<Difficulty, GameConfig> = {
  easy: { ...BASE_CONFIG, startTickMs: 190, minTickMs: 90, speedStepMs: 3 },
  normal: { ...BASE_CONFIG, startTickMs: 150, minTickMs: 65, speedStepMs: 4 },
  hard: { ...BASE_CONFIG, startTickMs: 110, minTickMs: 45, speedStepMs: 5 },
};

export const samePoint = (a: Point, b: Point): boolean => a.x === b.x && a.y === b.y;

export const isInside = (p: Point, gridSize: number): boolean =>
  p.x >= 0 && p.y >= 0 && p.x < gridSize && p.y < gridSize;

/** Picks a random cell that the snake does not occupy, or null if the board is full. */
export function spawnFood(snake: readonly Point[], gridSize: number, rng: Rng): Point | null {
  const occupied = new Set(snake.map((p) => p.y * gridSize + p.x));
  const free: Point[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!occupied.has(y * gridSize + x)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  const index = Math.min(free.length - 1, Math.floor(rng() * free.length));
  return free[index] ?? null;
}

export function createGame(config: GameConfig, rng: Rng = Math.random): GameState {
  const row = Math.floor(config.gridSize / 2);
  const headX = Math.floor(config.gridSize / 2);
  const snake: Point[] = Array.from({ length: config.initialLength }, (_, i) => ({
    x: headX - i,
    y: row,
  }));
  return {
    config,
    snake,
    prevSnake: snake,
    direction: 'right',
    queue: [],
    food: spawnFood(snake, config.gridSize, rng),
    score: 0,
    tickMs: config.startTickMs,
    status: 'ready',
    deathCause: null,
    foodSerial: 0,
  };
}

/** The direction the snake will be facing once every buffered turn has been applied. */
export const pendingDirection = (state: GameState): Direction =>
  state.queue[state.queue.length - 1] ?? state.direction;

/**
 * Buffers a turn. Turns that repeat the pending direction or reverse into it
 * are dropped, which is what stops a quick double-tap from folding the head
 * back into the body within a single tick.
 */
export function queueDirection(state: GameState, dir: Direction): GameState {
  if (state.status !== 'running' && state.status !== 'ready') return state;
  const pending = pendingDirection(state);
  if (dir === pending || dir === OPPOSITE[pending]) return state;
  if (state.queue.length >= MAX_QUEUED_TURNS) return state;
  return { ...state, queue: [...state.queue, dir] };
}

export function start(state: GameState): GameState {
  return state.status === 'ready' ? { ...state, status: 'running' } : state;
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'running') return { ...state, status: 'paused' };
  if (state.status === 'paused' || state.status === 'ready') return { ...state, status: 'running' };
  return state;
}

export function pause(state: GameState): GameState {
  return state.status === 'running' ? { ...state, status: 'paused' } : state;
}

/** Advances the game by one grid step. */
export function step(state: GameState, rng: Rng = Math.random): GameState {
  if (state.status !== 'running') return state;

  const [nextTurn, ...restQueue] = state.queue;
  const direction = nextTurn ?? state.direction;
  const head = state.snake[0];
  if (!head) return state;

  const v = DIRECTION_VECTORS[direction];
  const newHead: Point = { x: head.x + v.x, y: head.y + v.y };
  const { gridSize } = state.config;

  if (!isInside(newHead, gridSize)) {
    return {
      ...state,
      direction,
      queue: [],
      prevSnake: state.snake,
      status: 'over',
      deathCause: 'wall',
    };
  }

  const eats = state.food !== null && samePoint(newHead, state.food);
  // When not eating, the tail leaves its cell this tick, so the head may move into it.
  const body = eats ? state.snake : state.snake.slice(0, -1);

  if (body.some((p) => samePoint(p, newHead))) {
    return {
      ...state,
      direction,
      queue: [],
      prevSnake: state.snake,
      status: 'over',
      deathCause: 'self',
    };
  }

  const snake = [newHead, ...body];

  if (!eats) {
    return { ...state, snake, prevSnake: state.snake, direction, queue: restQueue };
  }

  const food = spawnFood(snake, gridSize, rng);
  return {
    ...state,
    snake,
    prevSnake: state.snake,
    direction,
    queue: restQueue,
    food,
    score: state.score + 1,
    foodSerial: state.foodSerial + 1,
    tickMs: Math.max(state.config.minTickMs, state.tickMs - state.config.speedStepMs),
    status: food === null ? 'won' : 'running',
  };
}

/** 1-based speed level derived from how far the tick has shrunk; shown in the HUD. */
export function speedLevel(state: GameState): number {
  const { startTickMs, speedStepMs } = state.config;
  return 1 + Math.floor((startTickMs - state.tickMs) / (speedStepMs * 3));
}
