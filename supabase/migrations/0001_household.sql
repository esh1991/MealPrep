-- Phase 0: the household and its two members.
-- Run in the Supabase SQL editor (or with the Supabase CLI). Membership is by
-- email so both people can be listed before their first Google sign-in.

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  display_name text not null,
  initial text not null,
  sort_order int not null default 0
);

alter table public.households enable row level security;
alter table public.members enable row level security;

-- The household of whoever is signed in, by the verified email on their JWT.
-- security definer so the members lookup does not recurse through RLS.
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.members
  where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

drop policy if exists "household read" on public.households;
create policy "household read" on public.households
  for select using (id = public.current_household_id());

drop policy if exists "household update" on public.households;
create policy "household update" on public.households
  for update using (id = public.current_household_id());

drop policy if exists "members read" on public.members;
create policy "members read" on public.members
  for select using (household_id = public.current_household_id());

drop policy if exists "members update self" on public.members;
create policy "members update self" on public.members
  for update using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Seed: one household, two members. Replace Doreen's email before running.
insert into public.households (name, settings)
values (
  'Shiva and Doreen',
  '{"snacksDefault": true, "freezeDays": ["Thu", "Fri"], "prepDay": "Sunday", "macroThresholds": {"protein": 35, "carbs": 45, "fat": 35}}'::jsonb
)
on conflict do nothing;

insert into public.members (household_id, email, display_name, initial, sort_order)
select h.id, m.email, m.display_name, m.initial, m.sort_order
from public.households h,
  (values
    ('esh1991@gmail.com', 'Shiva', 'S', 0),
    ('doreen@example.com', 'Doreen', 'D', 1)
  ) as m(email, display_name, initial, sort_order)
where h.name = 'Shiva and Doreen'
on conflict (email) do nothing;
