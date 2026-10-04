import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { BRAND, BUSINESS } from '../data/site.js';
import { fmt12, formatDateLabel } from '../lib/booking.js';

/**
 * Shown after a successful submit.
 *
 * In 'request' mode no money has moved — the copy says so plainly and pushes
 * the customer to call, rather than implying a confirmed paid booking.
 */
export default function BookingSuccess({ result }) {
  const { mode, reference, game, pkg, dateIso, start } = result;
  const isRequest = mode === 'request';

  return (
    <div
      className="bk bk-done"
      style={{ '--accent': game.accent, '--accent-soft': game.accentSoft, '--accent-ink': game.accentInk }}
    >
      <div className="bk-wrap bk-done-wrap">
        <Logo height={110} fallbackSize={34} />

        <span className="bk-done-tick" aria-hidden="true">
          ✓
        </span>

        <h1 className="chrome">{isRequest ? 'Request received' : 'You’re booked'}</h1>

        <p className="bk-done-lede">
          {isRequest ? (
            <>
              We&apos;ve got your slot request. <b>Nothing has been charged.</b> Call us on{' '}
              <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> with the reference below and
              we&apos;ll confirm it on the spot.
            </>
          ) : (
            <>Your slot is confirmed. We&apos;ve emailed the details — see you at the arena.</>
          )}
        </p>

        <div className="bk-ref">
          <span>Reference</span>
          <b>{reference}</b>
        </div>

        <div className="bk-summary bk-done-summary">
          <div className="bk-sum-row">
            <span>Game</span>
            <b>{game.name}</b>
          </div>
          <div className="bk-sum-row">
            <span>Package</span>
            <b>
              {pkg.qty} {pkg.unit}
            </b>
          </div>
          <div className="bk-sum-row">
            <span>Date</span>
            <b>{formatDateLabel(dateIso)}</b>
          </div>
          <div className="bk-sum-row">
            <span>Time</span>
            <b>
              {fmt12(start)} – {fmt12(start + pkg.durationMin)}
            </b>
          </div>
          <div className="bk-sum-row bk-sum-total">
            <span>{isRequest ? 'Payable at the arena' : 'Paid'}</span>
            <b>₹{result.booking.amount}</b>
          </div>
        </div>

        <div className="bk-done-cta">
          <a className="btn btn-primary" href={BUSINESS.phoneHref}>
            Call to confirm <span className="arr">→</span>
          </a>
          <Link className="btn btn-steel" to="/">
            Back to {BRAND.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
