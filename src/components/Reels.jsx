import { useEffect, useRef } from 'react';
import { useReveal } from '../hooks/useReveal.js';
import { ExternalArrowIcon, InstagramIcon } from './Icons.jsx';
import { BRAND, BUSINESS, REELS } from '../data/site.js';

/**
 * Autoplaying muted loops. Two bits of housekeeping carried over from the
 * original: nudge play() in case the browser defers it, and pause the video
 * once it scrolls out of view to save mobile data and battery.
 */
function useAutoplayLoop() {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const kick = () => {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    };
    v.addEventListener('loadeddata', kick, { once: true });
    v.addEventListener('canplay', kick, { once: true });
    kick();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? kick() : v.pause()));
      },
      { threshold: 0.25 }
    );
    io.observe(v);

    return () => io.disconnect();
  }, []);

  return ref;
}

function ReelCard({ reel }) {
  const videoRef = useAutoplayLoop();

  return (
    <a
      className="reel-card has-video"
      href={reel.href}
      target="_blank"
      rel="noopener"
      aria-label={reel.label}
    >
      <video
        className="reel-vid"
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={reel.poster}
      >
        <source src={reel.video} type="video/mp4" />
      </video>
      <span className="reel-open" aria-hidden="true">
        <ExternalArrowIcon />
      </span>
      <span className="reel-tag">{reel.tag}</span>
    </a>
  );
}

export default function Reels() {
  const [headRef, headCls] = useReveal();
  const [gridRef, gridCls] = useReveal('reels-grid');
  const [followRef, followCls] = useReveal('reels-follow');

  // Nothing to show — render no section at all rather than an empty heading.
  if (REELS.length === 0) return null;

  return (
    <section className="block" id="reels">
      <div className="wrap">
        <div className={`sec-head center ${headCls}`} ref={headRef}>
          <span className="sec-tag">From the floor</span>
          <h2 className="chrome">See it in motion.</h2>
        </div>

        <div className={gridCls} ref={gridRef}>
          {REELS.map((reel) => (
            <ReelCard key={reel.video} reel={reel} />
          ))}
        </div>

        <div className={followCls} ref={followRef}>
          <a className="btn btn-steel" href={BUSINESS.instagram} target="_blank" rel="noopener">
            <InstagramIcon />
            Follow {BRAND.short} on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
