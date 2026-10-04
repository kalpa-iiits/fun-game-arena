import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import { useAvailability } from '../hooks/useAvailability.js';
import { BUSINESS, LINKS } from '../data/site.js';
import { fmt12 } from '../lib/booking.js';

/**
 * Live availability, straight from the booking data.
 *
 * The urgency on this panel is earned, not manufactured: a game only reads
 * "Filling fast" when it genuinely has ≤40% of its remaining slots left, and
 * when the day is wide open the copy says that instead. Fake scarcity would
 * also be self-defeating here — the booking page is one click away and would
 * immediately contradict it.
 */

const TONE_LABEL = {
  critical: 'Almost gone',
  busy: 'Filling fast',
  open: 'Good availability',
  closed: 'Closed for today',
};

function GameRow({ game, isToday }) {
  const pctBooked = Math.max(0, 100 - game.pctFree);

  return (
    <article
      className={`av-row tone-${game.tone}`}
      style={{
        '--accent': game.accent,
        '--accent-soft': game.accentSoft,
        '--accent-ink': game.accentInk,
      }}
    >
      <div className="av-row-head">
        <span className="av-game">
          <span className="av-ico" aria-hidden="true">
            {game.icon}
          </span>
          {game.name}
        </span>
        <span className={`av-tag tone-${game.tone}`}>{TONE_LABEL[game.tone]}</span>
      </div>

      {game.total === 0 ? (
        <p className="av-note">
          {isToday ? 'No more slots today — tomorrow is open.' : 'Not available this day.'}
        </p>
      ) : (
        <>
          <div className="av-bar" role="img" aria-label={`${pctBooked}% booked`}>
            <span className="av-bar-fill" style={{ width: `${pctBooked}%` }} />
          </div>

          <div className="av-stats">
            <span className="av-free">
              <b>{game.free}</b> of {game.total} slots left
            </span>
            {game.nextFree !== null && (
              <span className="av-next">
                Next free <b>{fmt12(game.nextFree)}</b>
              </span>
            )}
          </div>

          {game.eveningTotal > 0 && (
            <p className="av-evening">
              {game.eveningFree === 0 ? (
                <>Evenings fully booked — daytime is wide open.</>
              ) : (
                <>
                  <b>{game.eveningFree}</b> evening {game.eveningFree === 1 ? 'slot' : 'slots'} left
                  after 5 PM — these go first.
                </>
              )}
            </p>
          )}
        </>
      )}

      <Link className="av-book" to={`${LINKS.book}?game=${game.id}`}>
        Book {game.name} →
      </Link>
    </article>
  );
}

export default function Availability() {
  const [headRef, headCls] = useReveal();
  const [day, setDay] = useState('today');

  const { loading, failed, today, tomorrow } = useAvailability();

  const view = day === 'today' ? today : tomorrow;

  // If today is effectively over, open on tomorrow — a panel showing a dead
  // day is worse than no panel.
  const effective = today?.dayOver && day === 'today' ? tomorrow : view;
  const showingTomorrow = effective === tomorrow;

  return (
    <section id="live" aria-label="Live availability">
      <div className="wrap">
        <div className={`sec-head center ${headCls}`} ref={headRef}>
          <span className="sec-tag">
            <span className="live-dot" /> Live availability
          </span>
          <h2 className="chrome">
            {loading || failed
              ? 'Who’s playing today.'
              : effective?.totalFree === 0
              ? 'Fully booked.'
              : 'Slots are going.'}
          </h2>
          <p>
            Straight from the booking sheet, updated every minute. What you see here is exactly
            what you can reserve.
          </p>
        </div>

        <div className="av-switch" role="tablist" aria-label="Choose a day">
          <button
            role="tab"
            aria-selected={!showingTomorrow}
            className="av-switch-btn"
            onClick={() => setDay('today')}
          >
            Today
          </button>
          <button
            role="tab"
            aria-selected={showingTomorrow}
            className="av-switch-btn"
            onClick={() => setDay('tomorrow')}
          >
            Tomorrow
          </button>
        </div>

        {loading ? (
          <div className="av-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="av-row av-skeleton" />
            ))}
          </div>
        ) : failed ? (
          <div className="av-fallback">
            <p>
              We can&apos;t reach the booking sheet right now. Call{' '}
              <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> and we&apos;ll tell you
              what&apos;s free.
            </p>
          </div>
        ) : (
          <>
            {effective.playingNow > 0 && (
              <div className="av-now">
                <span className="live-dot" />
                <b>{effective.playingNow}</b>
                {effective.playingNow === 1 ? ' session' : ' sessions'} on right now
              </div>
            )}

            <div className="av-grid">
              {effective.games.map((g) => (
                <GameRow key={g.id} game={g} isToday={effective.isToday} />
              ))}
            </div>
          </>
        )}

        <div className="live-foot">
          Updates every minute · Times in IST · Open daily {BUSINESS.hoursShort}
        </div>
      </div>
    </section>
  );
}
