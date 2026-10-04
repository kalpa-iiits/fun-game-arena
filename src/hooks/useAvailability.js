import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { BOOKING, GAMES } from '../data/site.js';
import {
  addDaysIso,
  buildGrid,
  hhmmToMins,
  istNow,
  timestampToIstMins,
} from '../lib/booking.js';

const POLL_MS = 60000;

/**
 * Live availability, computed from the same `busy_slots` view the booking page
 * reads — so what this panel claims is always what the booking page will
 * actually let you reserve.
 *
 * Everything here is derived from real reservations. Nothing is invented to
 * manufacture urgency: when the day is wide open it says so.
 *
 * The view exposes occupancy only (no names, phones or emails), so this shows
 * how full the arena is rather than who is in it.
 */
export function useAvailability() {
  const [state, setState] = useState({
    loading: true,
    failed: false,
    today: null,
    tomorrow: null,
  });

  const load = useCallback(async () => {
    if (!supabase) {
      setState({ loading: false, failed: true, today: null, tomorrow: null });
      return;
    }

    const now = istNow();
    const todayIso = now.dateIso;
    const tomorrowIso = addDaysIso(todayIso, 1);

    try {
      const { data, error } = await supabase
        .from('busy_slots')
        .select('resource, table_no, booking_date, starts_at, ends_at')
        .in('booking_date', [todayIso, tomorrowIso]);
      if (error) throw error;

      const rows = (data || []).map((b) => ({
        resource: b.resource,
        tableNo: b.table_no,
        dateIso: b.booking_date,
        start: timestampToIstMins(b.starts_at),
        end: timestampToIstMins(b.ends_at),
      }));

      setState({
        loading: false,
        failed: false,
        today: summarise(rows, todayIso, true, now.minOfDay),
        tomorrow: summarise(rows, tomorrowIso, false, now.minOfDay),
      });
    } catch (err) {
      console.warn('availability summary failed:', err);
      setState({ loading: false, failed: true, today: null, tomorrow: null });
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  return state;
}

/* Evenings genuinely go first, so they get their own count. */
const EVENING_FROM = hhmmToMins('17:00');

function summarise(rows, dateIso, isToday, nowMins) {
  const closeMins = hhmmToMins(BOOKING.close);

  const games = GAMES.map((game) => {
    // A "slot" is one session of this game's shortest package — the smallest
    // thing someone could still walk in and book.
    const unit = Math.min(...game.packages.map((p) => p.durationMin));
    const grid = buildGrid(unit);
    const busy = rows.filter((r) => r.resource === game.id && r.dateIso === dateIso);

    let total = 0;
    let free = 0;
    let eveningTotal = 0;
    let eveningFree = 0;
    let nextFree = null;
    let playingNow = 0;

    for (const start of grid) {
      const end = start + unit;

      // Today, anything inside the lead-time window is no longer bookable;
      // counting it as "available" would be a lie the booking page contradicts.
      const bookable = !isToday || start >= nowMins + BOOKING.leadTimeMin;

      const occupied = busy.filter((b) => start < b.end && end > b.start).length;
      const hasRoom = occupied < game.tables;

      if (bookable) {
        total += 1;
        if (hasRoom) {
          free += 1;
          if (nextFree === null) nextFree = start;
        }
        if (start >= EVENING_FROM) {
          eveningTotal += 1;
          if (hasRoom) eveningFree += 1;
        }
      }
    }

    if (isToday) {
      playingNow = busy.filter((b) => b.start <= nowMins && b.end > nowMins).length;
    }

    const pctFree = total === 0 ? 0 : Math.round((free / total) * 100);

    return {
      id: game.id,
      name: game.name,
      icon: game.icon,
      accent: game.accent,
      accentSoft: game.accentSoft,
      accentInk: game.accentInk,
      unit,
      total,
      free,
      pctFree,
      eveningFree,
      eveningTotal,
      nextFree,
      playingNow,
      // Honest bands. "Filling fast" only when it genuinely is.
      tone: total === 0 ? 'closed' : pctFree <= 15 ? 'critical' : pctFree <= 40 ? 'busy' : 'open',
    };
  });

  const dayOver = isToday && nowMins + BOOKING.leadTimeMin >= closeMins;

  return {
    dateIso,
    isToday,
    dayOver,
    games,
    totalFree: games.reduce((n, g) => n + g.free, 0),
    playingNow: games.reduce((n, g) => n + g.playingNow, 0),
  };
}
