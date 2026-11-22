export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type GameStatus = 'ready' | 'running' | 'paused' | 'over' | 'won';

export type DeathCause = 'wall' | 'self' | null;

export interface GameConfig {
  /** Number of columns and rows; the board is square. */
  readonly gridSize: number;
  /** Milliseconds per tick at the start of a game. */
  readonly startTickMs: number;
  /** Fastest allowed tick duration. */
  readonly minTickMs: number;
  /** How much faster (ms) each eaten food makes the game. */
  readonly speedStepMs: number;
  readonly initialLength: number;
}

export interface GameState {
  readonly config: GameConfig;
  /** Head first. */
  readonly snake: readonly Point[];
  /** Snake from the previous tick, used by the renderer to interpolate motion. */
  readonly prevSnake: readonly Point[];
  readonly direction: Direction;
  /**
   * Buffered direction changes, applied one per tick. Each entry was validated
   * against the entry before it, so a fast "up, left" while moving right can
   * never resolve to a reversal into the neck.
   */
  readonly queue: readonly Direction[];
  readonly food: Point | null;
  readonly score: number;
  readonly tickMs: number;
  readonly status: GameStatus;
  readonly deathCause: DeathCause;
  /** Incremented every time food is eaten (lets the UI animate spawns). */
  readonly foodSerial: number;
}

/** Returns a float in [0, 1). Injected so tests can be deterministic. */
export type Rng = () => number;
