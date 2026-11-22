/**
 * Canvas drawing for the board. Knows nothing about input or timing beyond the
 * numbers it is handed, so it can be swapped or restyled independently.
 */
import { DIRECTION_VECTORS } from './engine';
import type { GameState, Point } from './types';

export const THEME = {
  background: '#000000',
  gridDot: '#1c1c1e',
  head: [61, 108, 242] as const,
  bodyStart: [58, 102, 234] as const,
  bodyEnd: [44, 84, 200] as const,
  food: '#3b69f0',
  eye: '#050505',
} as const;

/** Radii are fractions of a cell, measured from the reference image. */
const R = {
  gridDot: 0.06,
  head: 0.43,
  bodyStart: 0.355,
  bodyEnd: 0.24,
  food: 0.39,
  eye: 0.058,
  eyeForward: 0.1,
  eyeSide: 0.118,
} as const;

export interface FrameInfo {
  /** 0..1 progress from prevSnake to snake. */
  alpha: number;
  /** ms since the current food appeared (drives the pop-in). */
  foodAge: number;
  /** ms since the game ended, or null while alive. */
  deathAge: number | null;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function mixRgb(a: readonly number[], b: readonly number[], t: number, alpha = 1): string {
  const ch = (i: number) => Math.round(lerp(a[i] ?? 0, b[i] ?? 0, t));
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, ${alpha})`;
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Where segment i is drawn this frame: sliding from its old cell to its new one. */
function segmentPosition(state: GameState, i: number, alpha: number): Point {
  const cur = state.snake[i]!;
  const prev = state.prevSnake[i] ?? state.prevSnake[state.prevSnake.length - 1] ?? cur;
  return { x: lerp(prev.x, cur.x, alpha), y: lerp(prev.y, cur.y, alpha) };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sizePx: number,
  state: GameState,
  frame: FrameInfo,
): void {
  const n = state.config.gridSize;
  const cell = sizePx / n;
  const center = (v: number) => (v + 0.5) * cell;

  ctx.save();
  ctx.fillStyle = THEME.background;
  ctx.fillRect(0, 0, sizePx, sizePx);

  // A short damped shake when the snake crashes.
  if (frame.deathAge !== null && frame.deathAge < 360) {
    const decay = 1 - frame.deathAge / 360;
    ctx.translate(Math.sin(frame.deathAge / 22) * cell * 0.12 * decay, 0);
  }

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      circle(ctx, center(x), center(y), cell * R.gridDot, THEME.gridDot);
    }
  }

  if (state.food) {
    const t = clamp01(frame.foodAge / 260);
    const scale = t >= 1 ? 1 : Math.max(0, easeOutBack(t));
    circle(ctx, center(state.food.x), center(state.food.y), cell * R.food * scale, THEME.food);
  }

  const dead = frame.deathAge !== null;
  const opacity = dead ? lerp(1, 0.45, clamp01(frame.deathAge! / 500)) : 1;
  const len = state.snake.length;
  const alpha = dead ? 1 : clamp01(frame.alpha);

  // Draw tail first so the head always sits on top.
  for (let i = len - 1; i >= 1; i--) {
    const p = segmentPosition(state, i, alpha);
    const t = len <= 2 ? 0 : (i - 1) / (len - 2);
    const r = lerp(R.bodyStart, R.bodyEnd, t) * cell;
    circle(ctx, center(p.x), center(p.y), r, mixRgb(THEME.bodyStart, THEME.bodyEnd, t, opacity));
  }

  if (len > 0) {
    const p = segmentPosition(state, 0, alpha);
    const hx = center(p.x);
    const hy = center(p.y);
    circle(ctx, hx, hy, R.head * cell, mixRgb(THEME.head, THEME.head, 0, opacity));

    const d = DIRECTION_VECTORS[state.direction];
    // Perpendicular to the heading, so the eyes sit side by side facing forward.
    const px = -d.y;
    const py = d.x;
    for (const side of [-1, 1]) {
      const ex = hx + d.x * R.eyeForward * cell + px * side * R.eyeSide * cell;
      const ey = hy + d.y * R.eyeForward * cell + py * side * R.eyeSide * cell;
      circle(ctx, ex, ey, R.eye * cell, THEME.eye);
    }
  }

  ctx.restore();
}
