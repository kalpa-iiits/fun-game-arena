import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Toast from '../components/Toast.jsx';
import { BRAND, BUSINESS, GAMES, LINKS } from '../data/site.js';
import {
  cancelMyBooking,
  fetchMyBookings,
  fmt12,
  formatDateLabel,
  looksLikeEmail,
  looksLikePhone,
} from '../lib/booking.js';

const STATUS_LABEL = {
  pending: 'Awaiting payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

function BookingCard({ booking, onCancel, cancelling }) {
  const game = GAMES.find((g) => g.id === booking.gameId);
  const pkg = game?.packages.find((p) => p.slug === booking.packageSlug);
  const cancellable = !booking.isPast && booking.status !== 'cancelled';

  return (
    <article
      className={`mb-card status-${booking.status}${booking.isPast ? ' is-past' : ''}`}
      style={game ? { '--accent': game.accent, '--accent-soft': game.accentSoft } : undefined}
    >
      <div className="mb-card-top">
        <span className="mb-game">
          <span aria-hidden="true">{game?.icon}</span>
          {game?.name ?? booking.gameId}
        </span>
        <span className={`mb-status status-${booking.status}`}>
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </div>

      <div className="mb-when">
        <strong>{formatDateLabel(booking.dateIso)}</strong>
        <span>
          {fmt12(booking.startMins)} – {fmt12(booking.endMins)}
        </span>
      </div>

      <dl className="mb-meta">
        <div>
          <dt>Package</dt>
          <dd>{pkg ? `${pkg.qty} ${pkg.unit}` : booking.packageSlug}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>₹{booking.amount}</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd className="mb-ref">{booking.reference}</dd>
        </div>
      </dl>

      {cancellable && (
        <button
          type="button"
          className="mb-cancel"
          disabled={cancelling}
          onClick={() => onCancel(booking)}
        >
          {cancelling ? 'Cancelling…' : 'Cancel this booking'}
        </button>
      )}
    </article>
  );
}

export default function MyBookings() {
  const [contact, setContact] = useState('');
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [cancellingRef, setCancellingRef] = useState(null);
  const [toast, setToast] = useState(null);

  const onChange = (e) => {
    setContact(e.target.value);
    if (error) setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const value = contact.trim();
    if (!looksLikePhone(value) && !looksLikeEmail(value)) {
      setError('Enter the 10-digit phone number or the email you booked with.');
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchMyBookings(value);
      setResults(rows);
    } catch (err) {
      setToast({ msg: err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancelling asks for whichever of phone/email was NOT used to search.
   * Looking a booking up is harmless; cancelling someone else's is not, so
   * the destructive action needs both details to line up.
   */
  const onCancel = async (booking) => {
    const searchedWithPhone = looksLikePhone(contact);
    const prompt = searchedWithPhone
      ? 'To confirm this is your booking, enter the email address you booked with:'
      : 'To confirm this is your booking, enter the phone number you booked with:';

    const second = window.prompt(
      `Cancel your ${formatDateLabel(booking.dateIso)} booking?\n\n${prompt}`
    );
    if (second === null) return; // dismissed

    const phone = searchedWithPhone ? contact : second;
    const email = searchedWithPhone ? second : contact;

    if (!looksLikePhone(phone) || !looksLikeEmail(email)) {
      setToast({ msg: 'That did not match. Nothing was cancelled.', error: true });
      return;
    }

    setCancellingRef(booking.reference);
    try {
      const ok = await cancelMyBooking({ reference: booking.reference, phone, email });
      if (ok) {
        setResults((rows) =>
          rows.map((r) => (r.reference === booking.reference ? { ...r, status: 'cancelled' } : r))
        );
        setToast({ msg: 'Booking cancelled. The slot is free again.' });
      } else {
        setToast({
          msg: 'Those details did not match this booking, so nothing was cancelled.',
          error: true,
        });
      }
    } catch (err) {
      setToast({ msg: err.message, error: true });
    } finally {
      setCancellingRef(null);
    }
  };

  const upcoming = (results ?? []).filter((b) => !b.isPast && b.status !== 'cancelled');
  const rest = (results ?? []).filter((b) => b.isPast || b.status === 'cancelled');

  return (
    <div className="bk mb">
      <header className="bk-nav">
        <Link to="/" className="bk-brand" aria-label={`${BRAND.name} — home`}>
          <Logo height={44} fallbackSize={16} />
        </Link>
        <div className="bk-nav-right">
          <Link to={LINKS.book}>Book</Link>
          <a className="bk-nav-call" href={BUSINESS.phoneHref}>
            {BUSINESS.phoneNav}
          </a>
        </div>
      </header>

      <div className="bk-wrap mb-wrap">
        <div className="bk-head">
          <span className="sec-tag">Your bookings</span>
          <h1 className="chrome">Find your slot.</h1>
          <p>
            Enter the phone number and email you booked with and we&apos;ll pull up your sessions.
          </p>
        </div>

        <form className="mb-form" onSubmit={onSubmit} noValidate>
          <div className={`bk-field${error ? ' err' : ''}`}>
            <label htmlFor="mb-contact">Phone number or email</label>
            <input
              id="mb-contact"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="98765 43210  or  you@example.com"
              value={contact}
              onChange={onChange}
            />
            {error && <span className="bk-err">{error}</span>}
          </div>

          <button type="submit" className="bk-submit mb-submit" disabled={loading}>
            {loading ? 'Looking…' : 'Find my bookings'}
          </button>

          <p className="mb-why">
            Use whichever you booked with — we&apos;ll find the rest.
          </p>
        </form>

        {results !== null && (
          <section className="mb-results">
            {results.length === 0 ? (
              <div className="mb-empty">
                <h2>Nothing found</h2>
                <p>
                  Nothing matches that phone number or email. Check it for typos — it needs to
                  be the one you booked with.
                </p>
                <div className="mb-empty-cta">
                  <Link className="btn btn-primary" to={LINKS.book}>
                    Book a session <span className="arr">→</span>
                  </Link>
                  <a className="btn btn-steel" href={BUSINESS.phoneHref}>
                    Call {BUSINESS.phoneDisplay}
                  </a>
                </div>
              </div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <h2 className="mb-group">Upcoming</h2>
                    <div className="mb-list">
                      {upcoming.map((b) => (
                        <BookingCard
                          key={b.reference}
                          booking={b}
                          onCancel={onCancel}
                          cancelling={cancellingRef === b.reference}
                        />
                      ))}
                    </div>
                  </>
                )}

                {rest.length > 0 && (
                  <>
                    <h2 className="mb-group">Past &amp; cancelled</h2>
                    <div className="mb-list">
                      {rest.map((b) => (
                        <BookingCard key={b.reference} booking={b} onCancel={onCancel} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}

        <div className="bk-back">
          <Link to="/">← Back to {BRAND.name}</Link>
        </div>
      </div>

      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
