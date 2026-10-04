import { useState } from 'react';
import { BRAND } from '../data/site.js';

/**
 * The FGA badge.
 *
 * If the PNG is missing (or fails to load) it falls back to a chrome wordmark
 * rather than a broken-image icon, so the header never looks broken while the
 * asset is being swapped in.
 */
export default function Logo({ height = 56, className = '', fallbackSize = 20 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`wordmark ${className}`} style={{ fontSize: fallbackSize }} aria-label={BRAND.name}>
        <span className="wm-a">{BRAND.short}</span>
        <span className="wm-b">Fun Game Arena</span>
      </span>
    );
  }

  return (
    <img
      src={BRAND.logo}
      alt={`${BRAND.name} logo`}
      className={className}
      style={{ height }}
      onError={() => setFailed(true)}
    />
  );
}
