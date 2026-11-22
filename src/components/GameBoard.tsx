import { useEffect, useRef, type ReactNode } from 'react';
import type { GameController } from '../game/controller';

interface Props {
  controller: GameController;
  children?: ReactNode;
}

/** The square canvas. Keeps its backing store matched to CSS size × devicePixelRatio. */
export function GameBoard({ controller, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    controller.attachCanvas(canvas);

    const sync = () => {
      const { width } = canvas.getBoundingClientRect();
      controller.resize(width, window.devicePixelRatio || 1);
    };
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    // Zooming or moving to another monitor changes DPR without resizing the element.
    window.addEventListener('resize', sync);
    sync();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      controller.attachCanvas(null);
    };
  }, [controller]);

  return (
    <div className="board">
      <canvas ref={canvasRef} className="board__canvas" role="img" aria-label="Snake game board" />
      {children}
    </div>
  );
}
