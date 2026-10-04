import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { BRAND, BUSINESS, FOOTER_SEO_LINKS, GAMES, LINKS, NAV_LINKS } from '../data/site.js';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Logo height={100} fallbackSize={34} />
            <p className="foot-tag">
              Three arenas under one roof — indoor cricket nets, 8-ball pool and table tennis. {' '}
              {BRAND.tagline}
            </p>
          </div>

          <div className="foot-col">
            <h4>Explore</h4>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="foot-col">
            <h4>What we offer</h4>
            {FOOTER_SEO_LINKS.map((l) =>
              l.href ? (
                <a key={l.label} href={l.href}>
                  {l.label}
                </a>
              ) : (
                <p key={l.label}>{l.label}</p>
              )
            )}
          </div>

          <div className="foot-col">
            <h4>Book a game</h4>
            {GAMES.map((g) => (
              <Link key={g.id} to={LINKS.pkg(g.id, g.packages[0].slug)}>
                {g.name} — from {g.from}
              </Link>
            ))}
          </div>

          <div className="foot-col">
            <h4>Visit</h4>
            <p>{BUSINESS.addressOneLine}</p>
            <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
            {BUSINESS.email && (
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            )}
            <p>{BUSINESS.hours}</p>
          </div>
        </div>

        <div className="ornament" style={{ marginTop: 46 }}>
          <i />
        </div>

        <div className="foot-bottom">
          <span>
            © {new Date().getFullYear()} {BRAND.name} · Cricket · Pool · Table Tennis
          </span>
          <span>{BRAND.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
