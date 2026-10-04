import { useReveal } from '../hooks/useReveal.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { SCORES } from '../data/site.js';

/* Each tile lights its top edge in its own accent via --score-accent. */

function CountTile({ score }) {
  const [revealRef, revealCls] = useReveal('score');
  const [numRef, text, phase] = useCountUp({
    to: score.to,
    suffix: score.suffix || '',
    speedGun: !!score.speed,
  });

  const numCls = ['score-num', score.speed ? 'speed-num' : '', phase].filter(Boolean).join(' ');

  return (
    <div className={revealCls} ref={revealRef} style={{ '--score-accent': score.accent }}>
      <span className={numCls} ref={numRef}>
        {text}
      </span>
      <span className="score-unit">{score.unit}</span>
    </div>
  );
}

/** A label rather than a number — never counts. */
function TextTile({ score }) {
  const [ref, cls] = useReveal('score');
  return (
    <div className={cls} ref={ref} style={{ '--score-accent': score.accent }}>
      <span className="score-num">{score.text}</span>
      <span className="score-unit">{score.unit}</span>
    </div>
  );
}

export default function Scoreboard() {
  return (
    <section className="scoreboard" aria-label="Key facts">
      <div className="wrap score-grid">
        {SCORES.map((s, i) =>
          s.text ? <TextTile key={i} score={s} /> : <CountTile key={i} score={s} />
        )}
      </div>
    </section>
  );
}
