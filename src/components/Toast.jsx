import { useEffect } from 'react';

/** Transient message above the fixed footer. Auto-dismisses after 4s. */
export default function Toast({ toast, onDone, duration = 4000 }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [toast, onDone, duration]);

  return (
    <div
      className={`bk-toast${toast ? ' show' : ''}${toast?.error ? ' err' : ''}`}
      role="status"
      aria-live="polite"
    >
      {toast?.msg}
    </div>
  );
}
