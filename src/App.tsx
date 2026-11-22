import { DirectionPad } from './components/DirectionPad';
import { GameBoard } from './components/GameBoard';
import { Hud } from './components/Hud';
import { Overlay } from './components/Overlay';
import { useGameController } from './hooks/useGameController';

export default function App() {
  const { controller, ui } = useGameController();

  return (
    <main className="app" data-status={ui.status}>
      <Hud ui={ui} controller={controller} />

      <section className="stage">
        <GameBoard controller={controller}>
          <Overlay ui={ui} controller={controller} />
        </GameBoard>
      </section>

      <section className="controls">
        <DirectionPad controller={controller} />
        <dl className="keys" aria-label="Keyboard controls">
          <div>
            <dt>
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <kbd>←</kbd>
              <kbd>→</kbd>
              <span className="keys__or">or</span>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </dt>
            <dd>Move</dd>
          </div>
          <div>
            <dt>
              <kbd className="kbd--wide">Space</kbd>
            </dt>
            <dd>Pause / resume</dd>
          </div>
          <div>
            <dt>
              <kbd className="kbd--wide">Enter</kbd>
            </dt>
            <dd>Restart after game over</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
