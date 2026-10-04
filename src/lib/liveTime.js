/* ---------------------------------------------------------------------------
   Time helpers for the live queue board.

   The arena runs 10:30 AM – 8:30 PM IST every day. Asia/Kolkata is a fixed
   UTC+5:30 offset (no DST), so IST is composed straight from UTC rather than
   trusting the visitor's local timezone.
   --------------------------------------------------------------------------- */

export const OPEN_MIN = 10 * 60 + 30; // 10:30
export const CLOSE_MIN = 20 * 60 + 30; // 20:30

/** "6:15 PM" in IST for a Date. */
export function fmtTime(d) {
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

/** Normalise a stored booking_time ("14:30" or "02:30 PM") → minutes since midnight. */
export function bookingTimeToMins(t) {
  if (!t) return null;
  const trim = String(t).trim();
  const ap = /pm/i.test(trim) ? 'PM' : /am/i.test(trim) ? 'AM' : null;
  const core = trim.replace(/\s*[AP]M\s*$/i, '').trim();
  const [hStr, mStr] = core.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return null;
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + (isNaN(m) ? 0 : m);
}

/** Minutes since midnight → "6:15 PM". */
export function minsToFmt(min) {
  if (min == null || isNaN(min)) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "HH:MM" → minutes since midnight. */
export function hhmmToMins(s) {
  return (s || '').split(':').reduce((h, m) => h * 60 + (+m || 0), 0);
}

/**
 * Slot length in minutes. Staff sessions carry run_time_minutes; public
 * bookings don't, so it's inferred from the package (3/5 overs = 10 min,
 * 10 overs = 15 min).
 */
export function slotDuration(r) {
  if (r.run_time_minutes) return r.run_time_minutes;
  const o = Number(r.overs || 0);
  if (o >= 10) return 15;
  if (o > 0) return 10;
  return null;
}

/** "6:15 PM – 6:30 PM" for a queue row, or "Walk-in" when there's no slot. */
export function fmtRange(r) {
  const startMin = bookingTimeToMins(r.booking_time);
  if (startMin == null) return r.booking_time ? String(r.booking_time).toUpperCase() : 'Walk-in';
  const dur = slotDuration(r);
  const startTxt = minsToFmt(startMin);
  return dur ? `${startTxt} – ${minsToFmt(startMin + dur)}` : startTxt;
}

export function pad3(n) {
  return String(n).padStart(3, '0');
}

/** Current IST minute-of-day plus the IST calendar date as YYYY-MM-DD. */
export function istNowParts() {
  const d = new Date();
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const minOfDay = (utcMin + 330) % 1440;
  const istDate = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return { minOfDay, dateIso: `${y}-${m}-${day}` };
}

export function nextDayIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

/** 'open' | 'before_hours' | 'after_hours' */
export function clockState() {
  const m = istNowParts().minOfDay;
  if (m < OPEN_MIN) return 'before_hours';
  if (m >= CLOSE_MIN) return 'after_hours';
  return 'open';
}

/** "Rahul Sharma" → "Rahul S." for the public feed. */
export function maskName(s) {
  if (!s) return 'Someone';
  const parts = String(s).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${(parts[1][0] || '').toUpperCase()}.`;
}
