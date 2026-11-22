import type { GameController } from '../game/controller';
import type { Direction } from '../game/types';

/** Arrow keys by `key`; letters by physical `code` so WASD sits under the same fingers on AZERTY etc. */
const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const CODE_DIRECTIONS: Record<string, Direction> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Listens on `window`, so the game responds without the board needing focus.
 * Returns an unbind function.
 */
export function bindKeyboard(controller: GameController, target: Window = window): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;

    const dir = KEY_DIRECTIONS[e.key] ?? CODE_DIRECTIONS[e.code];
    if (dir) {
      // Stop the page from scrolling under the board.
      e.preventDefault();
      controller.turn(dir);
      return;
    }

    if (e.code === 'Space' || e.key === ' ') {
      // Also keeps a focused button from being "clicked" by the space bar.
      e.preventDefault();
      if (!e.repeat) controller.togglePause();
      return;
    }

    if (e.key === 'Enter') {
      const { status } = controller.getSnapshot();
      if (status === 'over' || status === 'won') {
        e.preventDefault();
        controller.restart();
      }
    }
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
