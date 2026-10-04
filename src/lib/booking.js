/* ---------------------------------------------------------------------------
   Booking engine — pure logic, no React.

   The slot grid is generated client-side from BOOKING.open/close and the
   selected package's durationMin. Taken intervals come from the backend (or
   nowhere, when none is configured) and are subtracted at render time.
   --------------------------------------------------------------------------- */

import { BOOKING } from '../data/site.js';
import { supabase } from './supabase.js';

export const pad = (n) => String(n).padStart(2, '0');

export const hhmmToMins = (s) => {
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + m;
};

export const minsToHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** 630 → "10:30 AM" */
export function fmt12(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
}

/** Price strings in site.js carry the ₹ — this pulls the number out. */
export const priceToNumber = (price) => Number(String(price).replace(/[^\d.]/g, '')) || 0;

/* --- IST calendar helpers ------------------------------------------------- */
/* Asia/Kolkata is a fixed UTC+5:30 with no DST, so IST is composed straight
   from UTC rather than trusting the visitor's own timezone. A customer in
   London must see the same slots as one standing in the arena. */

export function istNow() {
  const d = new Date();
  const shifted = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
  return {
    dateIso: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
      shifted.getUTCDate()
    )}`,
    minOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The date chips: today + the next BOOKING.daysAhead - 1 days, in IST. */
export function buildDates() {
  const today = istNow().dateIso;
  return Array.from({ length: BOOKING.daysAhead }, (_, i) => {
    const iso = addDaysIso(today, i);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return {
      iso,
      dow: i === 0 ? 'Today' : DOW[dt.getUTCDay()],
      day: d,
      mon: MON[m - 1],
      isToday: i === 0,
    };
  });
}

/** "2026-10-04" → "Sat, 4 Oct" */
export function formatDateLabel(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DOW[dt.getUTCDay()]}, ${d} ${MON[m - 1]}`;
}

/**
 * "2026-10-05" + 630 → "2026-10-05T10:30:00+05:30"
 *
 * An explicit IST offset, so the instant stored in Postgres means the same
 * wall-clock time at the arena no matter where the customer booked from.
 */
export function istTimestamp(dateIso, mins) {
  return `${dateIso}T${minsToHHMM(mins)}:00+05:30`;
}

/** Back the other way: a timestamptz from the DB → IST minutes-of-day. */
export function timestampToIstMins(ts) {
  const d = new Date(ts);
  const shifted = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/* --- the grid ------------------------------------------------------------- */

/**
 * Start times for a package, stepping by its own duration so sessions tile
 * back to back. A slot only appears if it finishes before closing time.
 */
export function buildGrid(durationMin) {
  const open = hhmmToMins(BOOKING.open);
  const close = hhmmToMins(BOOKING.close);
  const slots = [];
  for (let t = open; t + durationMin <= close; t += durationMin) slots.push(t);
  return slots;
}

/**
 * Reserved intervals for one game on one date, as IST minutes-of-day.
 *
 * Reads the `busy_slots` view, which exposes occupancy only — the public key
 * cannot read the bookings table itself, so no customer's name or number is
 * ever sent to the browser.
 */
export async function fetchBusy(resource, dateIso) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('busy_slots')
    .select('table_no, starts_at, ends_at')
    .eq('resource', resource)
    .eq('booking_date', dateIso);
  if (error) throw error;
  return (data || []).map((b) => ({
    tableNo: b.table_no,
    start: timestampToIstMins(b.starts_at),
    end: timestampToIstMins(b.ends_at),
  }));
}

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

/** Table numbers (1..tables) with nothing booked across [start, end). */
export function freeTables(start, end, busy, tables) {
  const taken = new Set(
    busy.filter((b) => overlaps(start, end, b.start, b.end)).map((b) => b.tableNo)
  );
  const free = [];
  for (let n = 1; n <= tables; n += 1) if (!taken.has(n)) free.push(n);
  return free;
}

/**
 * Decorate each start time with why it can (or can't) be booked.
 *
 * A slot is only full once every table is occupied — with three pool tables,
 * two existing bookings at 7 PM still leave 7 PM bookable.
 *
 * `past` covers both elapsed times and the lead-time buffer: a slot must be
 * BOOKING.leadTimeMin minutes out so staff can set the lane up.
 */
export function buildSlots({ durationMin, dateIso, busy = [], tables = 1 }) {
  const now = istNow();
  const isToday = dateIso === now.dateIso;

  return buildGrid(durationMin).map((start) => {
    const end = start + durationMin;
    const free = freeTables(start, end, busy, tables);
    const tooSoon = isToday && start < now.minOfDay + BOOKING.leadTimeMin;
    return {
      start,
      end,
      label: fmt12(start),
      freeTables: free,
      disabled: free.length === 0 || tooSoon,
      reason: free.length === 0 ? 'taken' : tooSoon ? 'too-soon' : null,
    };
  });
}

/* --- validation ----------------------------------------------------------- */

/**
 * Returns { values } on success or { errors } keyed by field.
 * Indian mobile numbers: 10 digits, optionally with a 91 country prefix.
 */
export function validateDetails({ name, phone, email }) {
  const errors = {};
  const trimmedName = (name || '').trim();

  if (trimmedName.length < 2 || trimmedName.length > 100 || /[<>]/.test(trimmedName)) {
    errors.name = 'Please enter your full name.';
  }

  const digits = (phone || '').replace(/\D/g, '');
  const normalizedPhone =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (normalizedPhone.length !== 10 || !/^[6-9]/.test(normalizedPhone)) {
    errors.phone = 'Please enter a valid 10-digit mobile number.';
  }

  const trimmedEmail = (email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (Object.keys(errors).length) return { errors };
  return { values: { name: trimmedName, phone: normalizedPhone, email: trimmedEmail } };
}

/* --- totals --------------------------------------------------------------- */

export function computeTotal(pkg) {
  const base = priceToNumber(pkg?.price);
  const fee = base ? BOOKING.gatewayFee(base) : 0;
  return { base, fee, total: base + fee };
}

/* --- submitting ----------------------------------------------------------- */

/** A human-readable reference the customer can quote on the phone. */
export function makeReference() {
  const { dateIso } = istNow();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FGA-${dateIso.replace(/-/g, '').slice(2)}-${rand}`;
}

export const PAYMENTS_ENABLED = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
export const BOOKINGS_ENABLED = Boolean(supabase);

/** Thrown when the chosen slot filled up while the customer was typing. */
export class SlotTakenError extends Error {
  constructor() {
    super('That slot was just taken. Please pick another time.');
    this.name = 'SlotTakenError';
  }
}

/**
 * Place the booking.
 *
 * Writes a `pending` row to Supabase. Staff promote it to `confirmed` once
 * the customer has paid at the arena — no money moves online yet.
 *
 * Concurrency is handled by the database, not by this function. An exclusion
 * constraint on (resource, table_no, time range) makes overlapping rows
 * physically unstorable, so two people confirming the same slot in the same
 * millisecond cannot both win. The loser comes back as Postgres error 23P01,
 * and we simply try the next free table; when every table collides the slot
 * is genuinely gone and the customer is told so.
 *
 * Resolves to { mode, reference, booking } or throws with a message that is
 * safe to show the customer.
 */
export async function submitBooking({ game, pkg, dateIso, start, details, freeTables: offered }) {
  const reference = makeReference();
  const { total } = computeTotal(pkg);
  const end = start + pkg.durationMin;

  const booking = {
    reference,
    gameId: game.id,
    gameName: game.name,
    packageSlug: pkg.slug,
    packageLabel: `${pkg.qty} ${pkg.unit}`,
    dateIso,
    startHHMM: minsToHHMM(start),
    endHHMM: minsToHHMM(end),
    amount: total,
    ...details,
  };

  if (!BOOKINGS_ENABLED) {
    // No backend configured — nothing is stored, and the confirmation screen
    // says so plainly rather than implying a reservation exists.
    return { mode: 'request', reference, booking };
  }

  // Re-read availability at submit time: the grid the customer is looking at
  // may be minutes old. Fall back to the tables we were offered if this fails.
  let candidates = offered;
  try {
    const busy = await fetchBusy(game.id, dateIso);
    candidates = freeTables(start, end, busy, game.tables);
  } catch {
    /* advisory only — the constraint below is the real guard */
  }
  if (!candidates || candidates.length === 0) throw new SlotTakenError();

  const row = {
    reference,
    resource: game.id,
    booking_date: dateIso,
    starts_at: istTimestamp(dateIso, start),
    ends_at: istTimestamp(dateIso, end),
    package_slug: pkg.slug,
    amount_rupees: total,
    customer_name: details.name,
    customer_phone: details.phone,
    customer_email: details.email,
    status: 'pending',
  };

  for (const tableNo of candidates) {
    // returning: 'minimal' matters — the anon role has INSERT but deliberately
    // no SELECT on bookings, so asking for the row back would 401.
    const { error } = await supabase
      .from('bookings')
      .insert({ ...row, table_no: tableNo }, { returning: 'minimal' });

    if (!error) return { mode: 'booked', reference, tableNo, booking };
    if (error.code !== '23P01') {
      console.error('booking insert failed', error);
      throw new Error('We could not save your booking. Please try again, or call us.');
    }
    // 23P01 = exclusion violation: someone took this table first. Next one.
  }

  throw new SlotTakenError();
}


/* --- "my bookings" -------------------------------------------------------- */

/** True if the string looks like a 10-digit Indian mobile. */
export function looksLikePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 && /^[6-9]/.test(last10);
}

export function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

/**
 * A customer's own bookings, found by phone number OR email — whichever they
 * typed. The RPC works out which it is.
 */
export async function fetchMyBookings(contact) {
  if (!supabase) throw new Error('Booking lookup is not configured yet.');

  const { data, error } = await supabase.rpc('my_bookings', {
    p_contact: String(contact || '').trim(),
  });

  if (error) {
    // 42883 = function missing, i.e. 02_my_bookings.sql has not been run
    if (error.code === '42883' || /function .* does not exist/i.test(error.message || '')) {
      throw new Error('Booking lookup is not set up yet. Please call us instead.');
    }
    console.error('my_bookings failed', error);
    throw new Error('We could not look that up. Please try again, or call us.');
  }

  return (data || []).map((b) => ({
    reference: b.reference,
    gameId: b.resource,
    packageSlug: b.package_slug,
    dateIso: b.booking_date,
    startMins: timestampToIstMins(b.starts_at),
    endMins: timestampToIstMins(b.ends_at),
    amount: b.amount_rupees,
    status: b.status,
    // "upcoming" drives the sort and the cancel button
    isPast: new Date(b.ends_at).getTime() < Date.now(),
  }));
}

/** Cancel one of the customer's own bookings. Resolves true if it cancelled. */
export async function cancelMyBooking({ reference, phone, email }) {
  if (!supabase) throw new Error('Booking lookup is not configured yet.');
  const { data, error } = await supabase.rpc('cancel_my_booking', {
    p_reference: reference,
    p_phone: phone,
    p_email: email,
  });
  if (error) {
    console.error('cancel_my_booking failed', error);
    throw new Error('We could not cancel that. Please call us.');
  }
  return data === true;
}
