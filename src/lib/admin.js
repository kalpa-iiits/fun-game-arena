/* ---------------------------------------------------------------------------
   Staff-side data access.

   Everything here runs as a signed-in Supabase user. The policies in
   supabase/03_admin.sql check membership of the `admins` allow-list, so a
   plain authenticated account — should one ever exist — gets nothing back.
   The gate is enforced in the database, not here.
   --------------------------------------------------------------------------- */

import { supabase } from './supabase.js';
import { addDaysIso, istNow, timestampToIstMins } from './booking.js';

export function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function signIn(email, password) {
  const sb = requireClient();
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    // Supabase returns the same message for "no such user" and "wrong
    // password", which is correct — distinguishing them would let someone
    // enumerate staff accounts.
    throw new Error('Those details were not recognised.');
  }
  return data.session;
}

export async function signOut() {
  await requireClient().auth.signOut();
}

export async function getSession() {
  const { data } = await requireClient().auth.getSession();
  return data.session ?? null;
}

export function onAuthChange(fn) {
  const { data } = requireClient().auth.onAuthStateChange((_event, session) => fn(session));
  return () => data.subscription.unsubscribe();
}

/** Is the signed-in user actually on the staff allow-list? */
export async function isAdmin() {
  const sb = requireClient();
  const { data, error } = await sb.from('admins').select('user_id').limit(1);
  if (error) return false;
  return (data || []).length > 0;
}

export const RANGES = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'Next 7 days',
  past: 'Past 7 days',
};

function rangeToDates(range) {
  const { dateIso } = istNow();
  switch (range) {
    case 'tomorrow':
      return [addDaysIso(dateIso, 1), addDaysIso(dateIso, 1)];
    case 'week':
      return [dateIso, addDaysIso(dateIso, 6)];
    case 'past':
      return [addDaysIso(dateIso, -7), addDaysIso(dateIso, -1)];
    case 'today':
    default:
      return [dateIso, dateIso];
  }
}

/** Full booking rows, including customer contact details. Staff only. */
export async function fetchBookings(range) {
  const sb = requireClient();
  const [from, to] = rangeToDates(range);

  const { data, error } = await sb
    .from('bookings')
    .select('*')
    .gte('booking_date', from)
    .lte('booking_date', to)
    .order('starts_at', { ascending: true });

  if (error) {
    if (error.code === '42501' || error.code === 'PGRST301') {
      throw new Error('This account does not have staff access.');
    }
    throw new Error(error.message || 'Could not load bookings.');
  }

  return (data || []).map((b) => ({
    id: b.id,
    reference: b.reference,
    gameId: b.resource,
    tableNo: b.table_no,
    dateIso: b.booking_date,
    startMins: timestampToIstMins(b.starts_at),
    endMins: timestampToIstMins(b.ends_at),
    packageSlug: b.package_slug,
    amount: b.amount_rupees,
    name: b.customer_name,
    phone: b.customer_phone,
    email: b.customer_email,
    status: b.status,
    createdAt: b.created_at,
  }));
}

export async function setBookingStatus(id, status) {
  const sb = requireClient();
  const { error } = await sb.from('bookings').update({ status }).eq('id', id);
  if (error) throw new Error(error.message || 'Could not update that booking.');
}

/* --- arena shutdown switch ------------------------------------------------ */

export async function fetchArenaStatus() {
  const sb = requireClient();
  const { data, error } = await sb.from('arena_status').select('*').eq('id', 1).single();
  if (error) return null;
  const today = istNow().dateIso;
  return {
    closed: Boolean(data.closed_today) && data.closed_on === today,
    reason: data.closed_reason || '',
  };
}

export async function setArenaClosed(closed, reason) {
  const sb = requireClient();
  const { error } = await sb
    .from('arena_status')
    .update({
      closed_today: closed,
      closed_reason: closed ? reason || null : null,
      closed_on: closed ? istNow().dateIso : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw new Error(error.message || 'Could not update the arena status.');
}
