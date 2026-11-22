import { useEffect, useState, useSyncExternalStore } from 'react';
import { GameController } from '../game/controller';
import { bindKeyboard } from '../input/keyboard';

declare global {
  interface Window {
    __snake?: GameController;
  }
}

/** Owns one GameController for the lifetime of the component tree. */
export function useGameController() {
  const [controller] = useState(() => new GameController('normal'));
  const ui = useSyncExternalStore(controller.subscribe, controller.getSnapshot);

  useEffect(() => {
    controller.startLoop();
    const unbindKeys = bindKeyboard(controller);

    // Pause automatically when the player switches tabs or apps.
    const onHidden = () => {
      if (document.visibilityState === 'hidden') controller.pause();
    };
    const onBlur = () => controller.pause();
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('blur', onBlur);

    if (import.meta.env.DEV) window.__snake = controller;

    return () => {
      controller.stopLoop();
      unbindKeys();
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('blur', onBlur);
    };
  }, [controller]);

  return { controller, ui };
}
