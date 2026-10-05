-- ===========================================================================
-- Staff access
--
-- Run this in the Supabase SQL Editor after 02_my_bookings.sql.
-- Then follow the two setup steps at the bottom of this file.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- admins
--
-- An allow-list of staff accounts. The booking policies below check membership
-- of this table, NOT merely "is signed in" — otherwise anyone who created a
-- Supabase account on this project could read every customer's name, phone
-- and email. Being authenticated is not the same as being staff.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Staff may see the allow-list (so the app can confirm "am I staff?"),
-- but only via this policy — and nobody can edit it except through the
-- SQL editor with the service role.
create policy "staff can read the allow-list"
  on public.admins for select to authenticated
  using (user_id = auth.uid());
grant select on public.admins to authenticated;


-- ---------------------------------------------------------------------------
-- Booking access for staff
-- ---------------------------------------------------------------------------
drop policy if exists "staff can read bookings" on public.bookings;
create policy "staff can read bookings"
  on public.bookings for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "staff can update bookings" on public.bookings;
create policy "staff can update bookings"
  on public.bookings for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

grant select, update on public.bookings to authenticated;


-- ---------------------------------------------------------------------------
-- Arena shutdown switch, for the admin panel's "close the arena" control
-- ---------------------------------------------------------------------------
drop policy if exists "staff can read arena status" on public.arena_status;
create policy "staff can read arena status"
  on public.arena_status for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "staff can update arena status" on public.arena_status;
create policy "staff can update arena status"
  on public.arena_status for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

alter table public.arena_status enable row level security;
grant select, update on public.arena_status to authenticated;


-- ===========================================================================
-- SETUP — two steps, both in the Supabase dashboard
--
-- 1. Create the staff login
--      Authentication → Users → Add user → "Create new user"
--      Enter an email and a strong password. Tick "Auto Confirm User".
--
-- 2. Grant it admin rights — edit the email below, then run this:
--
--      insert into public.admins (user_id, email)
--      select id, email from auth.users where email = 'you@example.com'
--      on conflict (user_id) do nothing;
--
-- 3. STRONGLY RECOMMENDED: turn off public sign-ups so nobody can create an
--    account on this project at all.
--      Authentication → Sign In / Providers → Email → disable "Allow new users
--      to sign up".
--    The allow-list above already blocks non-staff accounts from reading
--    anything, but with sign-ups off there is nothing to block.
--
-- To revoke someone later:
--      delete from public.admins where email = 'them@example.com';
-- ===========================================================================
