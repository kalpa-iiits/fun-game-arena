import { useEffect, useRef, useState } from 'react';

/**
 * Adds the `.in` class to a `.reveal` element the first time it scrolls into
 * view. Replaces the site's single shared IntersectionObserver — one observer
 * per element is negligible here and keeps the components self-contained.
 *
 *   const [ref, cls] = useReveal();
 *   <div ref={ref} className={cls}>…</div>
 */
export function useReveal(extraClass = '') {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const className = ['reveal', shown ? 'in' : '', extraClass].filter(Boolean).join(' ');
  return [ref, className];
}
