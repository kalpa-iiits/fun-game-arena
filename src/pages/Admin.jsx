import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Toast from '../components/Toast.jsx';
import { BRAND, GAMES } from '../data/site.js';
import { fmt12, formatDateLabel, istNow } from '../lib/booking.js';
import {
  RANGES,
  fetchArenaStatus,
  fetchBookings,
  getSession,
  isAdmin,
  onAuthChange,
  setArenaClosed,
  setBookingStatus,
  signIn,
  signOut,
} from '../lib/admin.js';

const STATUS_NEXT = {
  pending: [
    { to: 'confirmed', label: 'Mark paid' },
    { to: 'cancelled', label: 'Cancel' },
  ],
  confirmed: [{ to: 'cancelled', label: 'Cancel' }],
  cancelled: [{ to: 'pending', label: 'Restore' }],
};

function LoginScreen({ onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-login">
      <Logo height={76} fallbackSize={24} />
      <h1 className="chrome">Staff sign-in</h1>
      <p>This area shows customer contact details. Staff accounts only.</p>

      <form onSubmit={submit} noValidate>
        <div className="bk-field">
          <label htmlFor="ad-email">Email</label>
          <input
            id="ad-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="bk-field">
          <label htmlFor="ad-pass">Password</label>
          <input
            id="ad-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <span className="bk-err">{error}</span>}
        <button type="submit" className="bk-submit ad-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <Link className="ad-back" to="/">
        ← Back to {BRAND.name}
      </Link>
    </div>
  );
}

function Row({ booking, onStatus, busyId }) {
  const game = GAMES.find((g) => g.id === booking.gameId);
  const isBusy = busyId === booking.id;

  return (
    <tr className={`status-${booking.status}`} style={game ? { '--accent': game.accent } : undefined}>
      <td className="ad-time">
        <b>{fmt12(booking.startMins)}</b>
        <small>{fmt12(booking.endMins)}</small>
      </td>
      <td>
        <span className="ad-game">
          <span aria-hidden="true">{game?.icon}</span> {game?.name ?? booking.gameId}
        </span>
        <small className="ad-sub">
          {booking.packageSlug.replace(/-/g, ' ')} · table {booking.tableNo}
        </small>
      </td>
      <td>
        <b>{booking.name}</b>
        <small className="ad-sub">
          <a href={`tel:+91${booking.phone}`}>{booking.phone}</a>
        </small>
      </td>
      <td className="ad-amount">₹{booking.amount}</td>
      <td>
        <span className={`ad-status status-${booking.status}`}>{booking.status}</span>
        <small className="ad-sub ad-ref">{booking.reference}</small>
      </td>
      <td className="ad-actions">
        {(STATUS_NEXT[booking.status] ?? []).map((a) => (
          <button
            key={a.to}
            type="button"
            className={`ad-act act-${a.to}`}
            disabled={isBusy}
            onClick={() => onStatus(booking, a.to)}
          >
            {a.label}
          </button>
        ))}
      </td>
    </tr>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [allowed, setAllowed] = useState(null);
  const [range, setRange] = useState('today');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [arena, setArena] = useState(null);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
    return onAuthChange(setSession);
  }, []);

  useEffect(() => {
    if (!session) {
      setAllowed(null);
      return;
    }
    isAdmin().then(setAllowed);
  }, [session]);

  const load = useCallback(async () => {
    if (!session || allowed !== true) return;
    setLoading(true);
    try {
      const [bookings, status] = await Promise.all([fetchBookings(range), fetchArenaStatus()]);
      setRows(bookings);
      setArena(status);
    } catch (err) {
      setToast({ msg: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }, [range, session, allowed]);

  useEffect(() => {
    load();
  }, [load]);

  // Staff keep this open on a counter screen all evening.
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, 60000);
    return () => clearInterval(id);
  }, [load]);

  const onStatus = async (booking, to) => {
    setBusyId(booking.id);
    try {
      await setBookingStatus(booking.id, to);
      setRows((rs) => rs.map((r) => (r.id === booking.id ? { ...r, status: to } : r)));
      setToast({ msg: `${booking.reference} → ${to}` });
    } catch (err) {
      setToast({ msg: err.message, error: true });
    } finally {
      setBusyId(null);
    }
  };

  const toggleArena = async () => {
    const closing = !arena?.closed;
    const reason = closing ? window.prompt('Why is the arena closed today? (shown publicly)') : '';
    if (closing && reason === null) return;
    try {
      await setArenaClosed(closing, reason);
      setArena({ closed: closing, reason: reason || '' });
      setToast({ msg: closing ? 'Arena marked closed for today.' : 'Arena reopened.' });
    } catch (err) {
      setToast({ msg: err.message, error: true });
    }
  };

  const totals = useMemo(() => {
    const live = rows.filter((r) => r.status !== 'cancelled');
    return {
      count: live.length,
      revenue: live.reduce((n, r) => n + r.amount, 0),
      pending: rows.filter((r) => r.status === 'pending').length,
    };
  }, [rows]);

  if (session === undefined) return <div className="bk ad" />;
  if (!session) return <div className="bk ad"><LoginScreen onDone={() => {}} /></div>;

  if (allowed === false) {
    return (
      <div className="bk ad">
        <div className="ad-login">
          <h1 className="chrome">No access</h1>
          <p>
            This account is signed in but is not on the staff list. Ask an administrator to add
            it, then sign in again.
          </p>
          <button type="button" className="bk-submit ad-submit" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bk ad">
      <header className="bk-nav">
        <Link to="/" className="bk-brand">
          <Logo height={40} fallbackSize={14} />
        </Link>
        <div className="bk-nav-right">
          <span className="ad-who">{session.user?.email}</span>
          <button type="button" className="ad-signout" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="ad-wrap">
        <div className="ad-head">
          <h1 className="chrome">Bookings</h1>
          <button type="button" className="ad-refresh" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="ad-summary">
          <div className="ad-stat">
            <b>{totals.count}</b>
            <span>bookings</span>
          </div>
          <div className="ad-stat">
            <b>₹{totals.revenue}</b>
            <span>expected</span>
          </div>
          <div className="ad-stat">
            <b>{totals.pending}</b>
            <span>awaiting payment</span>
          </div>
          <button
            type="button"
            className={`ad-arena${arena?.closed ? ' is-closed' : ''}`}
            onClick={toggleArena}
          >
            {arena?.closed ? 'Arena CLOSED today — reopen' : 'Close arena for today'}
          </button>
        </div>

        <div className="ad-tabs">
          {Object.entries(RANGES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="ad-tab"
              aria-selected={range === key}
              onClick={() => setRange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="ad-empty">
            {loading ? 'Loading…' : `No bookings for ${RANGES[range].toLowerCase()}.`}
          </p>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Game</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => {
                  const prev = rows[i - 1];
                  const newDay = !prev || prev.dateIso !== b.dateIso;
                  return (
                    <Fragment key={b.id}>
                      {newDay && range !== 'today' && range !== 'tomorrow' && (
                        <tr className="ad-daysep">
                          <td colSpan={6}>{formatDateLabel(b.dateIso)}</td>
                        </tr>
                      )}
                      <Row booking={b} onStatus={onStatus} busyId={busyId} />
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="ad-foot">
          Auto-refreshes every minute · Times in IST · {istNow().dateIso}
        </p>
      </div>

      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
