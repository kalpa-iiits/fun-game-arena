-- ===========================================================================
-- "My bookings" lookup
--
-- Run this in the Supabase SQL Editor after schema.sql.
-- Safe to re-run.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- my_bookings(contact)
--
-- One field: a phone number OR an email address. Whichever the customer
-- remembers, it finds their sessions.
--
-- The public site still cannot SELECT from bookings — this function is the
-- only way out, and it is deliberately narrow about what it hands back:
-- no name, no phone, no email. Everything it returns is a session detail,
-- so a lookup can confirm that a contact has bookings but never reveals who
-- the person is or how else to reach them.
-- ---------------------------------------------------------------------------
drop function if exists public.my_bookings(text, text);

create or replace function public.my_bookings(p_contact text)
returns table (
  reference     text,
  resource      text,
  booking_date  date,
  starts_at     timestamptz,
  ends_at       timestamptz,
  package_slug  text,
  amount_rupees integer,
  status        text,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with input as (
    select
      -- "+91 70022 13840" -> "7002213840"
      right(regexp_replace(coalesce(p_contact, ''), '\D', '', 'g'), 10) as phone,
      lower(trim(coalesce(p_contact, '')))                             as email,
      length(regexp_replace(coalesce(p_contact, ''), '\D', '', 'g'))   as digits
  )
  select b.reference, b.resource, b.booking_date, b.starts_at, b.ends_at,
         b.package_slug, b.amount_rupees, b.status, b.created_at
  from public.bookings b, input i
  where
    (
      (i.digits >= 10 and b.customer_phone = i.phone)
      or (length(i.email) > 3 and position('@' in i.email) > 1 and lower(b.customer_email) = i.email)
    )
    -- recent history only, so an old leaked contact stays low-value
    and b.booking_date >= (now() at time zone 'Asia/Kolkata')::date - 60
  order by b.starts_at desc
  limit 50;
$$;

revoke all on function public.my_bookings(text) from public;
grant execute on function public.my_bookings(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- cancel_my_booking(reference, phone, email)
--
-- Cancelling is destructive and cannot be undone by the customer, so unlike
-- the lookup it asks for BOTH the phone and the email on the booking. If it
-- accepted the same single field as the lookup, anyone who found a booking
-- could also cancel it — a cheap way to sabotage a day's trade. Requiring the
-- pair means only the person who actually made the booking can cancel it.
--
-- Also refuses once the session has started.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_my_booking(
  p_reference text, p_phone text, p_email text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  hit integer;
begin
  update public.bookings b
  set status = 'cancelled'
  where b.reference = p_reference
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10
    and right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10) = b.customer_phone
    and lower(trim(coalesce(p_email, ''))) = lower(b.customer_email)
    and b.status <> 'cancelled'
    and b.starts_at > now();          -- no cancelling a session already underway

  get diagnostics hit = row_count;
  return hit > 0;
end;
$$;

revoke all on function public.cancel_my_booking(text, text, text) from public;
grant execute on function public.cancel_my_booking(text, text, text) to anon, authenticated;
