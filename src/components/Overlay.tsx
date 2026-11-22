import type { GameController, UiSnapshot } from '../game/controller';
import type { Difficulty } from '../game/engine';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
};

/** Message layer over the board for every non-running state. */
export function Overlay({ ui, controller }: { ui: UiSnapshot; controller: GameController }) {
  if (ui.status === 'running') return null;

  let title: string;
  let detail: string;
  let action: { label: string; onClick: () => void };

  switch (ui.status) {
    case 'ready':
      title = 'Dot Snake';
      detail = 'Press an arrow key or tap a direction to start';
      action = { label: 'Start', onClick: () => controller.togglePause() };
      break;
    case 'paused':
      title = 'Paused';
      detail = 'Press Space to resume';
      action = { label: 'Resume', onClick: () => controller.togglePause() };
      break;
    case 'won':
      title = 'Board cleared';
      detail = `You filled every cell. Score ${ui.score}`;
      action = { label: 'Play again', onClick: () => controller.restart() };
      break;
    case 'over':
      title = 'Game over';
      detail = `${ui.deathCause === 'wall' ? 'You hit the wall.' : 'You ran into yourself.'} Score ${ui.score}`;
      action = { label: 'Play again', onClick: () => controller.restart() };
      break;
  }

  const showDifficulty = ui.status === 'ready' || ui.status === 'over' || ui.status === 'won';

  return (
    <div className="overlay" role="dialog" aria-live="polite" aria-label={title} key={ui.status}>
      <h1 className="overlay__title">{title}</h1>
      <p className="overlay__detail">{detail}</p>
      {(ui.status === 'over' || ui.status === 'won') && ui.newBest && (
        <p className="overlay__badge">New best</p>
      )}
      <button type="button" className="pill-btn" onClick={action.onClick}>
        {action.label}
        {(ui.status === 'over' || ui.status === 'won') && <kbd>Enter</kbd>}
      </button>
      {showDifficulty && (
        <div className="segmented" role="radiogroup" aria-label="Difficulty">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={ui.difficulty === d}
              className="segmented__opt"
              onClick={() => controller.setDifficulty(d)}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
