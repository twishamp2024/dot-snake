import { useCallback, useState, type PointerEvent, type MouseEvent } from 'react';
import type { GameController } from '../game/controller';
import type { Direction } from '../game/types';
import { ChevronIcon } from './Icons';

const BUTTONS: { dir: Direction; label: string }[] = [
  { dir: 'up', label: 'Up' },
  { dir: 'left', label: 'Left' },
  { dir: 'right', label: 'Right' },
  { dir: 'down', label: 'Down' },
];

/**
 * Four on-screen buttons driven by Pointer Events, so one code path covers
 * mouse, touch and pen. Pointer capture keeps the press alive if the finger
 * slides slightly off the button.
 */
export function DirectionPad({ controller }: { controller: GameController }) {
  const [pressed, setPressed] = useState<Direction | null>(null);

  const down = useCallback(
    (dir: Direction) => (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // No focus ring, no text selection, no synthetic mouse events on touch.
      e.preventDefault();
      setPressed(dir);
      controller.press(dir);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone (e.g. very fast tap); the input above still counts */
      }
    },
    [controller],
  );

  const up = useCallback(
    (dir: Direction) => () => {
      setPressed((p) => (p === dir ? null : p));
      controller.release(dir);
    },
    [controller],
  );

  // Keyboard activation (Tab + Enter) arrives as a click with detail 0;
  // pointer-driven clicks were already handled on pointerdown.
  const click = useCallback(
    (dir: Direction) => (e: MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) controller.turn(dir);
    },
    [controller],
  );

  return (
    <div className="dpad" role="group" aria-label="Direction controls">
      {BUTTONS.map(({ dir, label }) => (
        <button
          key={dir}
          type="button"
          className={`dpad__btn dpad__btn--${dir}`}
          data-pressed={pressed === dir || undefined}
          aria-label={`Move ${label.toLowerCase()}`}
          onPointerDown={down(dir)}
          onPointerUp={up(dir)}
          onPointerCancel={up(dir)}
          onLostPointerCapture={up(dir)}
          onClick={click(dir)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ChevronIcon direction={dir} />
          <span className="dpad__label">{label.toUpperCase()}</span>
        </button>
      ))}
      <span className="dpad__hub" aria-hidden="true" />
    </div>
  );
}
