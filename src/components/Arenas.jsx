import { useReveal } from '../hooks/useReveal.js';
import { useSpotlight } from '../hooks/useSpotlight.js';
import { GAMES } from '../data/site.js';

/**
 * The three games, each owning its colour. `--accent` / `--accent-soft` are
 * set per card and everything inside (rule, icon, bullets, hover ring, CTA)
 * reads from them — so adding a fourth arena is a data change, not a CSS one.
 */
function ArenaCard({ game, index, onMouseMove, onPick }) {
  const [ref, cls] = useReveal('arena');

  return (
    <article
      className={cls}
      ref={ref}
      onMouseMove={onMouseMove}
      style={{
        '--accent': game.accent,
        '--accent-soft': game.accentSoft,
        '--accent-ink': game.accentInk,
      }}
    >
      <div className="arena-head">
        <span className="arena-ico" aria-hidden="true">
          {game.icon}
        </span>
        <span className="arena-idx">0{index + 1}</span>
      </div>

      <h3>{game.name}</h3>
      <p className="arena-sub">{game.sub}</p>
      <p>{game.blurb}</p>

      <ul>
        {game.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>

      <div className="arena-foot">
        <span className="arena-from">From</span>
        <span className="arena-price">{game.from}</span>
      </div>

      {/* Jumps to pricing with this game's tab already selected. */}
      <a className="arena-cta" href="#pricing" onClick={() => onPick(game.id)}>
        See {game.name} rates →
      </a>
    </article>
  );
}

export default function Arenas({ onPick }) {
  const [headRef, headCls] = useReveal();
  const spotlight = useSpotlight();

  return (
    <section className="block" id="arenas">
      <div className="wrap">
        <div className={`sec-head center ${headCls}`} ref={headRef}>
          <span className="sec-tag">Pick your arena</span>
          <h2 className="chrome">Three ways to compete.</h2>
          <p>
            Cricket, pool and table tennis under one roof. Come for one, stay for all three — and
            find out where your limit actually is.
          </p>
        </div>

        <div className="arena-grid">
          {GAMES.map((game, i) => (
            <ArenaCard
              key={game.id}
              game={game}
              index={i}
              onMouseMove={spotlight}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
