import { useCallback } from 'react';

/**
 * Cursor-following radial highlight on feature/package cards. Writes --mx/--my
 * custom properties the CSS reads in the card's ::before gradient.
 */
export function useSpotlight() {
  return useCallback((e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);
}
