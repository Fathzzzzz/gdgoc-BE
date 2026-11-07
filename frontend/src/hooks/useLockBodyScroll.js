import { useEffect } from 'react';

/** Prevent the page behind an open overlay from scrolling. */
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}