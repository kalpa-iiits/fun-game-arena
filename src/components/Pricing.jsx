import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import { useSpotlight } from '../hooks/useSpotlight.js';
import { GAMES, LINKS } from '../data/site.js';

/**
 * One pricing grid, switched by game. The selected tab drives `--accent` on
 * the whole section, so the cards, flags and buttons re-colour to whichever
 * arena you're looking at.
 *
 * `active` is lifted to App so the arena cards can deep-link into a tab.
 */
function PriceCard({ pkg, game, onMouseMove }) {
  const [ref, cls] = useReveal(pkg.best ? 'price-card best' : 'price-card');

  return (
    <div className={cls} ref={ref} onMouseMove={onMouseMove}>
      {pkg.best && <div className="price-flag">Best value</div>}

      <div className="price-qty">
        {pkg.qty}
        <small>{pkg.unit}</small>
      </div>

      <div className="price-amt">
        <b>{pkg.price}</b>
        <span>{pkg.per}</span>
      </div>

      <p className="price-desc">{pkg.desc}</p>

      <ul className="price-perks">
        {pkg.perks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>

      <Link className="price-book" to={LINKS.pkg(game.id, pkg.slug)}>
        Book {pkg.qty} {pkg.unit} →
      </Link>
    </div>
  );
}

export default function Pricing({ active, setActive }) {
  const [headRef, headCls] = useReveal();
  const spotlight = useSpotlight();

  const game = GAMES.find((g) => g.id === active) ?? GAMES[0];

  return (
    <section
      className="block"
      id="pricing"
      style={{
        '--accent': game.accent,
        '--accent-soft': game.accentSoft,
        '--accent-ink': game.accentInk,
      }}
    >
      <div className="wrap">
        <div className={`sec-head center ${headCls}`} ref={headRef}>
          <span className="sec-tag">Rates</span>
          <h2 className="chrome">Pay for the game you play.</h2>
          <p>
            Cricket is priced per person, pool and table tennis per table — so the cost splits
            across your group. No membership needed to book.
          </p>
        </div>

        <div className="price-tabs" role="tablist" aria-label="Choose a game">
          {GAMES.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={g.id === active}
              className="price-tab"
              style={{
                '--accent': g.accent,
                '--accent-soft': g.accentSoft,
                '--accent-ink': g.accentInk,
              }}
              onClick={() => setActive(g.id)}
            >
              <span aria-hidden="true">{g.icon}</span>
              {g.name}
            </button>
          ))}
        </div>

        {/* keyed so the cards re-mount (and re-reveal) when the tab changes */}
        <div className="price-grid" key={game.id}>
          {game.packages.map((pkg) => (
            <PriceCard key={pkg.slug} pkg={pkg} game={game} onMouseMove={spotlight} />
          ))}
        </div>

        <p className="price-note">
          Walk-ins welcome during opening hours · Group and corporate rates available on request
        </p>
      </div>
    </section>
  );
}
