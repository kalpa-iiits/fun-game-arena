import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { BRAND, GAMES, LINKS } from '../data/site.js';

/**
 * Badge-forward hero: the logo leads, the headline picks up its red and blue
 * halves, and the gold tagline sits under it exactly as it does on the badge.
 * Words rise in on a stagger; the badge keeps a slow float.
 */
export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap hero-inner">
        <Logo className="hero-badge" height="auto" fallbackSize={52} />

        <h1>
          <span className="l1">
            <span className="word chrome">Three</span>{' '}
            <span className="word chrome">games.</span>
          </span>
          <span className="l2">
            <span className="word red">One</span>{' '}
            <span className="word blue">arena.</span>
          </span>
        </h1>

        <p className="tagline">{BRAND.tagline}</p>

        <p className="lede">
          Indoor cricket nets with a high-speed bowling machine, tournament-cloth pool tables and
          match-spec table tennis — all under one roof. Walk in, or lock a slot in under a minute.
        </p>

        <div className="hero-cta">
          <Link className="btn btn-primary" to={LINKS.book}>
            Book a session <span className="arr">→</span>
          </Link>
          <a className="btn btn-steel" href="#arenas">
            Explore the arenas
          </a>
        </div>

        <div className="hero-games">
          {GAMES.map((g) => (
            <a
              key={g.id}
              className={`hero-game ${g.id === 'cricket' ? 'red' : g.id === 'pool' ? 'gold' : 'blue'}`}
              href="#arenas"
            >
              <span className="g-ico" aria-hidden="true">
                {g.icon}
              </span>
              {g.name}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
