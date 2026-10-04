import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { GAMES, LINKS } from '../data/site.js';

/* Fixed bottom bar. `body { padding-bottom: 86px }` reserves the space so it
   never covers the footer. */
export default function BookBar() {
  const cheapest = GAMES[0].from;

  return (
    <div className="bookbar">
      <div className="bb-l">
        <Logo height={44} fallbackSize={15} />
        <div className="bb-text">
          <b>Ready to play?</b>
          <small>Cricket · Pool · Table Tennis — from {cheapest}</small>
        </div>
      </div>
      <Link className="bb-cta" to={LINKS.book}>
        <span className="pulse" />
        Book now →
      </Link>
    </div>
  );
}
