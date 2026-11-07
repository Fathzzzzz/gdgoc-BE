import { useEffect } from 'react';

/** Close an overlay when the user presses Escape (keyboard accessibility). */
export function useEscapeKey(handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') handler(event);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, active]);
}