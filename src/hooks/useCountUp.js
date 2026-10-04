import { useEffect, useRef, useState } from 'react';

/**
 * Number counters in the stats strip. Two flavours, both firing once when the
 * element scrolls into view:
 *
 *  - plain    : ease-out cubic ramp to the target.
 *  - speedGun : accelerates *past* the target, then settles back onto it and
 *               flashes — the radar-gun read-out on the 130+ km/h stat.
 *
 * Returns [ref, text, phase] — phase carries `revving` / `locked` so the
 * existing CSS shake + flash animations still apply.
 */
export function useCountUp({ to, suffix = '', speedGun = false, duration }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [phase, setPhase] = useState(''); // '' | 'revving' | 'locked'
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf;

    const runPlain = () => {
      const dur = duration ?? 1400;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(to * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const runSpeedGun = () => {
      const dur = duration ?? 1900;
      const t0 = performance.now();
      const over = to + 12; // overshoot, like a gun catching the peak
      setPhase('revving');
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        let val;
        if (p < 0.78) {
          val = over * Math.pow(p / 0.78, 1.9); // accelerate up past target
        } else {
          val = over - (over - to) * ((p - 0.78) / 0.22); // settle back down
        }
        setValue(Math.round(val));
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          setValue(to);
          setPhase('locked');
          setTimeout(() => setPhase(''), 600);
        }
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || started.current) return;
          started.current = true;
          io.unobserve(e.target);
          if (speedGun) runSpeedGun();
          else runPlain();
        });
      },
      { threshold: 0, rootMargin: '0px 0px -32% 0px' }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, suffix, speedGun, duration]);

  return [ref, `${value}${suffix}`, phase];
}
