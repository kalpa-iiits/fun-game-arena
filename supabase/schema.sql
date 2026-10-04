-- ===========================================================================
-- Fun Game Arena — booking schema
--
-- Run this once, whole file, in the Supabase SQL Editor.
-- Safe to re-run: every statement is guarded.
-- ===========================================================================

-- btree_gist lets an exclusion constraint mix equality (=) with range
-- overlap (&&) in a single index. Without it the constraint below fails.
create extension if not exists btree_gist;


-- ---------------------------------------------------------------------------
-- bookings
--
-- One row per reserved session. `resource` is the game id from site.js
-- ('cricket' | 'pool' | 'table-tennis') and `table_no` distinguishes the
-- physical net/table within that game, so three pool tables book independently.
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  reference       text        not null unique,

  resource        text        not null,
  table_no        smallint    not null default 1,

  booking_date    date        not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,

  package_slug    text        not null,
  amount_rupees   integer     not null check (amount_rupees >= 0),

  customer_name   text        not null,
  customer_phone  text        not null,
  customer_email  text        not null,

  status          text        not null default 'pending'
                              check (status in ('pending', 'confirmed', 'cancelled')),
  created_at      timestamptz not null default now(),

  constraint ends_after_start check (ends_at > starts_at)
);

-- THE important one. Postgres refuses, at the storage layer, to store two
-- overlapping live bookings for the same table. Two people confirming the
-- 6:30 PM slot in the same millisecond cannot both succeed — the loser gets
-- error 23P01, which the app turns into "that slot just went, pick another".
-- No application logic can be forgotten or raced around.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_double_booking'
  ) then
    alter table public.bookings
      add constraint bookings_no_double_booking
      exclude using gist (
        resource  with =,
        table_no  with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status <> 'cancelled');
  end if;
end $$;

-- Availability lookups hit this on every date change.
create index if not exists bookings_lookup_idx
  on public.bookings (resource, booking_date)
  where status <> 'cancelled';


-- ---------------------------------------------------------------------------
-- Row-level security
--
-- The public site may CREATE a booking and nothing else. It cannot read the
-- table at all, so no visitor can enumerate other customers' names, phone
-- numbers or email addresses.
-- ---------------------------------------------------------------------------
alter table public.bookings enable row level security;

revoke all on public.bookings from anon, authenticated;
grant insert on public.bookings to anon;

drop policy if exists "anon can create a booking request" on public.bookings;
create policy "anon can create a booking request"
  on public.bookings
  for insert
  to anon
  with check (
    -- a request only; staff promote it to 'confirmed'
    status = 'pending'
    -- no booking the past
    and booking_date >= (now() at time zone 'Asia/Kolkata')::date
    and ends_at > starts_at
    -- cheap sanity checks so junk can't be injected straight from the browser
    and char_length(customer_name)  between 2 and 100
    and char_length(customer_email) between 5 and 160
    and customer_phone ~ '^[6-9][0-9]{9}$'
    and amount_rupees between 0 and 100000
  );


-- ---------------------------------------------------------------------------
-- busy_slots
--
-- What the booking page reads to grey out taken times: occupancy only, with
-- every personal column left behind.
--
-- The view deliberately runs with its owner's rights (the Supabase linter
-- flags this as "security definer view") — that is the point. It is how the
-- page sees *that* a slot is taken without being able to see *who* took it.
-- ---------------------------------------------------------------------------
create or replace view public.busy_slots as
  select resource, table_no, booking_date, starts_at, ends_at
  from public.bookings
  where status <> 'cancelled';

grant select on public.busy_slots to anon, authenticated;


-- ---------------------------------------------------------------------------
-- is_arena_open
--
-- The emergency "we're shut today" switch the live board and booking page
-- already call. Flip `closed_today` in arena_status to take the day offline.
-- ---------------------------------------------------------------------------
create table if not exists public.arena_status (
  id            smallint primary key default 1 check (id = 1),
  closed_today  boolean not null default false,
  closed_reason text,
  closed_on     date,
  updated_at    timestamptz not null default now()
);

insert into public.arena_status (id) values (1) on conflict (id) do nothing;

create or replace function public.is_arena_open()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    -- the flag only counts for the day it was set, so it self-clears at
    -- the next IST midnight and nobody has to remember to switch it back
    'reason',
      case
        when closed_today and closed_on = (now() at time zone 'Asia/Kolkata')::date
        then 'closed_for_day'
        else null
      end,
    'closed_reason',
      case
        when closed_today and closed_on = (now() at time zone 'Asia/Kolkata')::date
        then closed_reason
        else null
      end
  )
  from public.arena_status where id = 1;
$$;

grant execute on function public.is_arena_open() to anon, authenticated;

revoke all on public.arena_status from anon, authenticated;


-- ===========================================================================
-- Staff cheat-sheet
--
--   See today's bookings
--     select reference, resource, table_no, starts_at, ends_at,
--            customer_name, customer_phone, status
--     from public.bookings
--     where booking_date = (now() at time zone 'Asia/Kolkata')::date
--     order by starts_at;
--
--   Confirm one
--     update public.bookings set status = 'confirmed' where reference = 'FGA-...';
--
--   Close the arena for today
--     update public.arena_status
--     set closed_today = true,
--         closed_reason = 'Machine servicing',
--         closed_on = (now() at time zone 'Asia/Kolkata')::date
--     where id = 1;
--
--   Reopen
--     update public.arena_status set closed_today = false where id = 1;
-- ===========================================================================
