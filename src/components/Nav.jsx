import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useScrolled } from '../hooks/useScrolled.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { BUSINESS, LINKS, NAV_LINKS } from '../data/site.js';

/**
 * Fixed top bar. Transparent over the hero, then condenses into a blurred
 * plate with the red→blue seam once you scroll.
 *
 * The drawer's open state toggles `body.nav-open` because the stylesheet keys
 * the burger animation, the scroll lock and the drawer transition off it.
 */
export default function Nav({ drawerOpen, setDrawerOpen }) {
  const { loading, failed, today, tomorrow } = useAvailability();

  // Past the last bookable slot, point at tomorrow rather than showing zero.
  const view = today?.dayOver ? tomorrow : today;
  const freeCount = loading || failed || !view ? null : view.totalFree;
  const scrolled = useScrolled(40);

  useEffect(() => {
    document.body.classList.toggle('nav-open', drawerOpen);
    return () => document.body.classList.remove('nav-open');
  }, [drawerOpen]);

  const close = () => setDrawerOpen(false);

  return (
    <>
      <nav className={scrolled ? 'scrolled' : undefined}>
        <a className="brand" href="#top" aria-label="Fun Game Arena — home">
          <Logo height={scrolled ? 46 : 56} />
        </a>

        <div className="nav-right">
          <div className="nav-links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>

          <a className="nav-call" href={BUSINESS.phoneHref}>
            {BUSINESS.phoneNav}
          </a>

          <a
            className={`nav-live${freeCount === 0 ? ' is-full' : ''}`}
            href="#live"
            aria-label="Live availability"
          >
            <span className="dot" />
            <span className="label">{freeCount === 0 ? 'Full' : 'Free'}</span>
            <span className="count">{freeCount == null ? '—' : freeCount}</span>
          </a>

          <Link className="nav-ghost" to={LINKS.myBookings}>
            My Bookings
          </Link>
          <Link className="nav-pri" to={LINKS.book}>
            Book Now →
          </Link>

          <button
            className="nav-burger"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className="nav-drawer" role="dialog" aria-modal="true">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a href={BUSINESS.phoneHref} onClick={close}>
          {BUSINESS.phoneDrawer}
        </a>
        <Link to={LINKS.myBookings} className="nav-ghost" onClick={close}>
          My Bookings
        </Link>
        <Link to={LINKS.book} className="nav-pri" onClick={close}>
          Book Now →
        </Link>
      </div>
    </>
  );
}
