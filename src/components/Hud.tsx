import type { GameController, UiSnapshot } from '../game/controller';
import { PauseIcon, PlayIcon, RestartIcon } from './Icons';

export function Hud({ ui, controller }: { ui: UiSnapshot; controller: GameController }) {
  const canPause = ui.status === 'running' || ui.status === 'paused';
  const paused = ui.status === 'paused';

  return (
    <header className="hud">
      <div className="hud__stats">
        <Stat label="Score" value={ui.score} live />
        <Stat label="Best" value={ui.best} />
        <Stat label="Speed" value={ui.level} />
      </div>
      <div className="hud__actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => controller.togglePause()}
          disabled={!canPause}
          aria-label={paused ? 'Resume (Space)' : 'Pause (Space)'}
          title={paused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => controller.restart()}
          aria-label="Restart"
          title="Restart"
        >
          <RestartIcon />
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value, live }: { label: string; value: number; live?: boolean }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value" aria-live={live ? 'polite' : undefined}>
        {value}
      </span>
    </div>
  );
}
