import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Toast from '../components/Toast.jsx';
import BookingSuccess from '../components/BookingSuccess.jsx';
import { BOOKING, BRAND, BUSINESS, GAMES } from '../data/site.js';
import {
  buildDates,
  buildSlots,
  computeTotal,
  fetchBusy,
  fmt12,
  formatDateLabel,
  submitBooking,
  validateDetails,
} from '../lib/booking.js';

const STEPS = ['Game', 'Package', 'Date', 'Time', 'Details', 'Confirm'];

/**
 * Six-step booking flow. Each step unlocks the next; completed steps get a
 * green tick in the rail so progress is legible on a long mobile page.
 *
 * ?game= and ?pkg= preselect, so the pricing cards on the landing page can
 * deep-link straight into a package.
 */
export default function Book() {
  const [params, setParams] = useSearchParams();

  const [gameId, setGameId] = useState(null);
  const [pkgSlug, setPkgSlug] = useState(null);
  const [dateIso, setDateIso] = useState(null);
  const [start, setStart] = useState(null);
  const [details, setDetails] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});

  const [busySlots, setBusySlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [done, setDone] = useState(null);

  const dates = useMemo(() => buildDates(), []);
  const game = GAMES.find((g) => g.id === gameId) ?? null;
  const pkg = game?.packages.find((p) => p.slug === pkgSlug) ?? null;

  /* --- preselect from the query string, once ----------------------------- */
  useEffect(() => {
    const qGame = params.get('game');
    const qPkg = params.get('pkg');

    // A bare ?pkg= (no game) still works — find whichever arena owns that slug.
    const resolved =
      GAMES.find((g) => g.id === qGame) ??
      (qPkg ? GAMES.find((g) => g.packages.some((p) => p.slug === qPkg)) : null);

    if (resolved) {
      setGameId(resolved.id);
      if (qPkg && resolved.packages.some((p) => p.slug === qPkg)) setPkgSlug(qPkg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keep the URL in step with the selection so the page is shareable and the
     back button behaves. replace: true keeps it out of history. */
  useEffect(() => {
    const next = new URLSearchParams();
    if (gameId) next.set('game', gameId);
    if (pkgSlug) next.set('pkg', pkgSlug);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, pkgSlug]);

  /* --- availability ------------------------------------------------------ */
  /* Re-read whenever the game or date changes. A failure here is advisory:
     the booking still goes through, and the database's exclusion constraint
     is what actually prevents a double-booking. */
  useEffect(() => {
    if (!dateIso || !game) return;
    let cancelled = false;

    (async () => {
      setSlotsLoading(true);
      try {
        const rows = await fetchBusy(game.id, dateIso);
        if (!cancelled) setBusySlots(rows);
      } catch (err) {
        console.warn('availability lookup failed:', err);
        if (!cancelled) setBusySlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dateIso, game]);

  const slots = useMemo(
    () =>
      pkg && dateIso
        ? buildSlots({ durationMin: pkg.durationMin, dateIso, busy: busySlots, tables: game.tables })
        : [],
    [pkg, dateIso, busySlots, game]
  );

  const selectedSlot = slots.find((s) => s.start === start) ?? null;

  /* A slot that was valid a moment ago can stop being valid — the chosen date
     changed, or it just got taken. Drop it rather than booking a stale time. */
  useEffect(() => {
    if (start == null) return;
    const match = slots.find((s) => s.start === start);
    if (slots.length && (!match || match.disabled)) setStart(null);
  }, [slots, start]);

  const { base, fee, total } = computeTotal(pkg);
  const complete = Boolean(game && pkg && dateIso && start != null);

  /* --- step rail --------------------------------------------------------- */
  const doneFlags = [
    Boolean(game),
    Boolean(pkg),
    Boolean(dateIso),
    start != null,
    Boolean(details.name && details.phone && details.email) && !Object.keys(errors).length,
    false,
  ];
  const currentStep = doneFlags.findIndex((d) => !d);

  const setField = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const stepRefs = useRef({});
  const scrollToStep = useCallback((n) => {
    stepRefs.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const onSubmit = async () => {
    if (busy) return;
    if (!complete) {
      setToast({ msg: 'Pick a game, package, date and time first.', error: true });
      return;
    }
    const result = validateDetails(details);
    if (result.errors) {
      setErrors(result.errors);
      setToast({ msg: 'Please check your details.', error: true });
      scrollToStep(5);
      return;
    }

    setBusy(true);
    try {
      const outcome = await submitBooking({
        game,
        pkg,
        dateIso,
        start,
        details: result.values,
        freeTables: selectedSlot?.freeTables,
      });
      setDone({ ...outcome, game, pkg, dateIso, start });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setToast({ msg: err.message || 'Something went wrong. Please try again.', error: true });
      // Someone beat them to it — drop the selection and re-read the grid so
      // the gone slot greys out instead of staying invitingly selected.
      if (err.name === 'SlotTakenError') {
        setStart(null);
        try {
          setBusySlots(await fetchBusy(game.id, dateIso));
        } catch {
          /* leave the grid as-is */
        }
        scrollToStep(4);
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) return <BookingSuccess result={done} />;

  const accentStyle = game
    ? { '--accent': game.accent, '--accent-soft': game.accentSoft, '--accent-ink': game.accentInk }
    : {};

  return (
    <div className="bk" style={accentStyle}>
      <header className="bk-nav">
        <Link to="/" className="bk-brand" aria-label={`${BRAND.name} — home`}>
          <Logo height={44} fallbackSize={16} />
        </Link>
        <div className="bk-nav-right">
          <Link to="/#pricing">Pricing</Link>
          <Link to="/#faq">FAQ</Link>
          <a className="bk-nav-call" href={BUSINESS.phoneHref}>
            {BUSINESS.phoneNav}
          </a>
        </div>
      </header>

      <div className="bk-wrap">
        <div className="bk-head">
          <span className="sec-tag">Book a session</span>
          <h1 className="chrome">Lock your slot.</h1>
          <p>
            Pick your game, choose a time and you&apos;re set. Sessions from {GAMES[0].from} · Open
            daily {BUSINESS.hoursShort}.
          </p>
        </div>

        {/* progress rail */}
        <ol className="bk-rail" aria-label="Booking progress">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`bk-rail-step${doneFlags[i] ? ' is-done' : ''}${
                i === currentStep ? ' is-current' : ''
              }`}
            >
              <button type="button" onClick={() => scrollToStep(i + 1)}>
                <span className="bk-rail-dot">{doneFlags[i] ? '✓' : i + 1}</span>
                <span className="bk-rail-label">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        {/* ---------------------------------------------------------------- 1 */}
        <section className={`bk-step${game ? ' is-done' : ''}`} ref={(el) => (stepRefs.current[1] = el)}>
          <h2 className="bk-step-label">
            <span className="bk-step-num">1</span> Choose your game
          </h2>
          <div className="bk-game-grid">
            {GAMES.map((g) => (
              <button
                type="button"
                key={g.id}
                className={`bk-game${g.id === gameId ? ' sel' : ''}`}
                style={{ '--accent': g.accent, '--accent-soft': g.accentSoft }}
                aria-pressed={g.id === gameId}
                onClick={() => {
                  setGameId(g.id);
                  setPkgSlug(null);
                  setStart(null);
                }}
              >
                <span className="bk-game-ico" aria-hidden="true">
                  {g.icon}
                </span>
                <span className="bk-game-name">{g.name}</span>
                <span className="bk-game-sub">{g.sub}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- 2 */}
        <section className={`bk-step${pkg ? ' is-done' : ''}`} ref={(el) => (stepRefs.current[2] = el)}>
          <h2 className="bk-step-label">
            <span className="bk-step-num">2</span> Choose your package
          </h2>
          {!game ? (
            <p className="bk-empty">Pick a game above to see its packages.</p>
          ) : (
            <div className="bk-pkg-grid">
              {game.packages.map((p) => (
                <button
                  type="button"
                  key={p.slug}
                  className={`bk-pkg${p.slug === pkgSlug ? ' sel' : ''}${p.best ? ' best' : ''}`}
                  aria-pressed={p.slug === pkgSlug}
                  onClick={() => {
                    setPkgSlug(p.slug);
                    setStart(null);
                  }}
                >
                  {p.best && <span className="bk-pkg-flag">Best value</span>}
                  <span className="bk-pkg-qty">{p.qty}</span>
                  <span className="bk-pkg-unit">{p.unit}</span>
                  <span className="bk-pkg-price">{p.price}</span>
                  <span className="bk-pkg-dur">{p.durationMin} min · {p.per}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- 3 */}
        <section className={`bk-step${dateIso ? ' is-done' : ''}`} ref={(el) => (stepRefs.current[3] = el)}>
          <h2 className="bk-step-label">
            <span className="bk-step-num">3</span> Pick a date
          </h2>
          <div className="bk-dates">
            {dates.map((d) => (
              <button
                type="button"
                key={d.iso}
                className={`bk-date${d.iso === dateIso ? ' sel' : ''}`}
                aria-pressed={d.iso === dateIso}
                onClick={() => {
                  setDateIso(d.iso);
                  setStart(null);
                }}
              >
                <span className="bk-date-dow">{d.dow}</span>
                <span className="bk-date-num">{d.day}</span>
                <span className="bk-date-mon">{d.mon}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- 4 */}
        <section className={`bk-step${start != null ? ' is-done' : ''}`} ref={(el) => (stepRefs.current[4] = el)}>
          <h2 className="bk-step-label">
            <span className="bk-step-num">4</span> Choose a time slot
          </h2>
          {!pkg || !dateIso ? (
            <p className="bk-empty">Select a package and a date to see available times.</p>
          ) : slotsLoading ? (
            <p className="bk-empty">Checking availability…</p>
          ) : slots.every((s) => s.disabled) ? (
            <p className="bk-empty">
              No free slots for this date and package. Try another date.
            </p>
          ) : (
            <>
              <div className="bk-slots">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s.start}
                    className={`bk-slot${s.disabled ? ' off' : ''}${
                      s.start === start ? ' sel' : ''
                    }`}
                    disabled={s.disabled}
                    aria-pressed={s.start === start}
                    title={
                      s.reason === 'taken'
                        ? 'Already booked'
                        : s.reason === 'too-soon'
                        ? `Needs ${BOOKING.leadTimeMin} minutes notice`
                        : undefined
                    }
                    onClick={() => setStart(s.start)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="bk-hint">
                Crossed-out times are booked or too soon. Slots need{' '}
                {BOOKING.leadTimeMin / 60} hours&apos; notice. Open daily {BUSINESS.hoursShort}.
              </p>
            </>
          )}
        </section>

        {/* ---------------------------------------------------------------- 5 */}
        <section className="bk-step" ref={(el) => (stepRefs.current[5] = el)}>
          <h2 className="bk-step-label">
            <span className="bk-step-num">5</span> Your details
          </h2>
          <div className="bk-fields">
            <div className={`bk-field${errors.name ? ' err' : ''}`}>
              <label htmlFor="bk-name">Full name</label>
              <input
                id="bk-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
                value={details.name}
                onChange={setField('name')}
              />
              {errors.name && <span className="bk-err">{errors.name}</span>}
            </div>

            <div className={`bk-field${errors.phone ? ' err' : ''}`}>
              <label htmlFor="bk-phone">Phone number</label>
              <input
                id="bk-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="e.g. 98765 43210"
                value={details.phone}
                onChange={setField('phone')}
              />
              {errors.phone && <span className="bk-err">{errors.phone}</span>}
            </div>

            <div className={`bk-field${errors.email ? ' err' : ''}`}>
              <label htmlFor="bk-email">
                Email <span className="opt">— so you can manage this booking later</span>
              </label>
              <input
                id="bk-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={details.email}
                onChange={setField('email')}
              />
              {errors.email && <span className="bk-err">{errors.email}</span>}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- 6 */}
        <section className="bk-step" ref={(el) => (stepRefs.current[6] = el)}>
          <h2 className="bk-step-label">
            <span className="bk-step-num">6</span> Confirm &amp; book
          </h2>

          {!complete ? (
            <p className="bk-empty">Complete the steps above to see your booking summary.</p>
          ) : (
            <div className="bk-summary">
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
              <div className="bk-sum-row">
                <span>Package price</span>
                <b>₹{base}</b>
              </div>
              <div className="bk-sum-row">
                <span>Booking fee</span>
                <b>+ ₹{fee}</b>
              </div>
              <div className="bk-sum-row bk-sum-total">
                <span>Total</span>
                <b>₹{total}</b>
              </div>
            </div>
          )}

          <button
            type="button"
            className="bk-submit"
            disabled={!complete || busy}
            onClick={onSubmit}
          >
            {busy
              ? 'Working…'
              : !complete
              ? 'Select a slot to continue'
              : `Confirm booking · ₹${total}`}
          </button>

          <p className="bk-note">
            Your slot is held for {BOOKING.holdMinutes} minutes while you confirm. Questions? Call{' '}
            <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.
          </p>
        </section>

        <div className="bk-back">
          <Link to="/">← Back to {BRAND.name}</Link>
        </div>
      </div>

      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
