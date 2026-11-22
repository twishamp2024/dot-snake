/**
 * Glue between the pure engine, the clock and the renderer. React only reads
 * the small `UiSnapshot` through subscribe/getSnapshot; the 60 fps work never
 * goes through React state.
 */
import {
  DIFFICULTIES,
  createGame,
  pause,
  queueDirection,
  speedLevel,
  start,
  step,
  togglePause,
  type Difficulty,
} from './engine';
import { drawFrame } from './renderer';
import type { DeathCause, Direction, GameState, GameStatus } from './types';

export interface UiSnapshot {
  status: GameStatus;
  score: number;
  best: number;
  /** True once this game's score beats the best that stood when it began. */
  newBest: boolean;
  level: number;
  length: number;
  difficulty: Difficulty;
  deathCause: DeathCause;
}

const BEST_KEY = (d: Difficulty) => `dot-snake:best:${d}`;
/** Never run more than this many catch-up ticks in one frame (e.g. after a stall). */
const MAX_TICKS_PER_FRAME = 4;

function readBest(d: Difficulty): number {
  try {
    return Number(localStorage.getItem(BEST_KEY(d))) || 0;
  } catch {
    return 0;
  }
}

function writeBest(d: Difficulty, value: number) {
  try {
    localStorage.setItem(BEST_KEY(d), String(value));
  } catch {
    /* storage unavailable (private mode); best score just won't persist */
  }
}

export class GameController {
  private state: GameState;
  private difficulty: Difficulty;
  private best: number;
  private bestAtStart: number;
  private snapshot: UiSnapshot;
  private listeners = new Set<() => void>();

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private sizePx = 0;

  private rafId = 0;
  private lastFrame: number | null = null;
  private accumulator = 0;
  private foodBornAt = 0;
  private diedAt: number | null = null;
  private held: Direction | null = null;

  constructor(difficulty: Difficulty = 'normal') {
    this.difficulty = difficulty;
    this.best = readBest(difficulty);
    this.bestAtStart = this.best;
    this.state = createGame(DIFFICULTIES[difficulty]);
    this.snapshot = this.buildSnapshot();
  }

  // ---- React external-store API -------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): UiSnapshot => this.snapshot;

  /** Exposed for tests and debugging. */
  getState(): GameState {
    return this.state;
  }

  // ---- Lifecycle ------------------------------------------------------------

  attachCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d') ?? null;
  }

  /** Called by the board when its CSS size or the device pixel ratio changes. */
  resize(cssSize: number, dpr: number) {
    if (!this.canvas || !this.ctx || cssSize <= 0) return;
    const px = Math.round(cssSize * dpr);
    if (this.canvas.width !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
    this.ctx.setTransform(px / cssSize, 0, 0, px / cssSize, 0, 0);
    this.sizePx = cssSize;
    this.render(performance.now());
  }

  startLoop() {
    if (this.rafId) return;
    this.lastFrame = null;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stopLoop() {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  // ---- Commands -------------------------------------------------------------

  /** A discrete direction input (key press or button tap). */
  turn(dir: Direction) {
    let s = this.state;
    if (s.status === 'over' || s.status === 'won' || s.status === 'paused') return;
    if (s.status === 'ready') {
      s = start(s);
      this.accumulator = 0;
    }
    this.commit(queueDirection(s, dir));
  }

  /** Begin holding an on-screen direction button. */
  press(dir: Direction) {
    this.held = dir;
    this.turn(dir);
  }

  release(dir?: Direction) {
    if (dir === undefined || this.held === dir) this.held = null;
  }

  togglePause() {
    if (this.state.status === 'ready') this.accumulator = 0;
    this.commit(togglePause(this.state));
  }

  pause() {
    this.commit(pause(this.state));
  }

  restart() {
    this.held = null;
    this.diedAt = null;
    this.accumulator = 0;
    this.foodBornAt = performance.now();
    this.bestAtStart = this.best;
    this.commit(createGame(DIFFICULTIES[this.difficulty]));
  }

  setDifficulty(d: Difficulty) {
    if (d === this.difficulty) return;
    this.difficulty = d;
    this.best = readBest(d);
    this.restart();
  }

  // ---- Internals ------------------------------------------------------------

  private frame = (now: number) => {
    this.rafId = requestAnimationFrame(this.frame);
    const dt = this.lastFrame === null ? 0 : Math.min(now - this.lastFrame, 250);
    this.lastFrame = now;

    if (this.state.status === 'running') {
      this.accumulator += dt;
      let ticks = 0;
      while (this.accumulator >= this.state.tickMs && ticks < MAX_TICKS_PER_FRAME) {
        this.accumulator -= this.state.tickMs;
        this.tick(now);
        ticks++;
        if (this.state.status !== 'running') break;
      }
      if (ticks === MAX_TICKS_PER_FRAME) this.accumulator = 0;
    }
    this.render(now);
  };

  private tick(now: number) {
    let s = this.state;
    // A held button keeps re-asserting its direction, so a turn that was
    // rejected (queue full) is applied as soon as it becomes legal.
    if (this.held && s.queue.length === 0) s = queueDirection(s, this.held);
    const next = step(s);
    if (next.foodSerial !== s.foodSerial) this.foodBornAt = now;
    if (next.status === 'over' && s.status === 'running') this.diedAt = now;
    this.commit(next);
  }

  private commit(next: GameState) {
    if (next === this.state) return;
    this.state = next;
    if (next.score > this.best) {
      this.best = next.score;
      writeBest(this.difficulty, this.best);
    }
    const snap = this.buildSnapshot();
    const prev = this.snapshot;
    const changed = (Object.keys(snap) as (keyof UiSnapshot)[]).some((k) => snap[k] !== prev[k]);
    if (changed) {
      this.snapshot = snap;
      this.listeners.forEach((l) => l());
    }
  }

  private buildSnapshot(): UiSnapshot {
    return {
      status: this.state.status,
      score: this.state.score,
      best: this.best,
      newBest: this.state.score > this.bestAtStart,
      level: speedLevel(this.state),
      length: this.state.snake.length,
      difficulty: this.difficulty,
      deathCause: this.state.deathCause,
    };
  }

  private render(now: number) {
    if (!this.ctx || this.sizePx <= 0) return;
    const s = this.state;
    const alpha = s.status === 'running' || s.status === 'paused' ? this.accumulator / s.tickMs : 1;
    drawFrame(this.ctx, this.sizePx, s, {
      alpha,
      foodAge: now - this.foodBornAt,
      deathAge: this.diedAt === null ? null : now - this.diedAt,
    });
  }
}
