-- MealPrep, schema app_mealprep, in the shared Supabase project.
--
-- Follows the house pattern: one schema per app, prefixed app_, sharing
-- auth.users and the platform schema with everything else. Nothing here
-- touches public, platform, or any other app's schema.
--
-- After running this, add app_mealprep to Project Settings > API >
-- Exposed schemas, or every query returns a schema-not-found error even
-- though the tables are right there in the table editor.

create schema if not exists app_mealprep;

grant usage on schema app_mealprep to anon, authenticated;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------

do $$ begin
  create type app_mealprep.meal_type as enum ('b', 'l', 'd', 's');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.weekday as enum ('Mon', 'Tue', 'Wed', 'Thu', 'Fri');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.unit as enum (
    'count', 'lb', 'oz', 'cup', 'tbsp', 'tsp',
    'can', 'clove', 'bunch', 'pint', 'head', 'scoop'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.aisle as enum (
    'Produce', 'Meat & fish', 'Dairy & eggs', 'Bakery', 'Pantry', 'Household', 'Other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.method as enum ('oven', 'stove', 'nocook');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.rating as enum ('keeper', 'good', 'work');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.pantry_status as enum ('none', 'staple', 'usual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_mealprep.source_kind as enum ('photo', 'notes', 'link', 'manual', 'seed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Household and members
-- ---------------------------------------------------------------------

create table if not exists app_mealprep.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  settings   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Membership is by email so both people can be listed before either has
-- signed in for the first time. user_id is filled in on first sign-in.
create table if not exists app_mealprep.members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references app_mealprep.households(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  email        text not null unique,
  display_name text not null,
  initial      text not null,
  sort_order   int  not null default 0
);

create index if not exists members_household_idx on app_mealprep.members(household_id);

-- The household of whoever is signed in, matched on the verified email in
-- their token. security definer so this lookup does not recurse through the
-- policies that call it.
create or replace function app_mealprep.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from app_mealprep.members
  where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

revoke all on function app_mealprep.current_household_id() from public;
grant execute on function app_mealprep.current_household_id() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Ingredients, recipes, versions
-- ---------------------------------------------------------------------

create table if not exists app_mealprep.ingredients (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references app_mealprep.households(id) on delete cascade,
  name          text not null,
  default_aisle app_mealprep.aisle not null default 'Pantry',
  pantry_status app_mealprep.pantry_status not null default 'none',
  constraint ingredients_name_unique unique (household_id, name)
);

create table if not exists app_mealprep.recipes (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references app_mealprep.households(id) on delete cascade,
  type               app_mealprep.meal_type not null,
  name               text not null,
  method             app_mealprep.method not null default 'stove',
  rating             app_mealprep.rating not null default 'good',
  source_kind        app_mealprep.source_kind not null default 'manual',
  source_ref         text not null default '',
  open_guesses       text[] not null default '{}',
  current_version_id uuid,
  created_at         timestamptz not null default now()
);

create index if not exists recipes_household_idx on app_mealprep.recipes(household_id);

-- Never updated after insert. A tweak inserts a new row (PRD 7.6).
create table if not exists app_mealprep.recipe_versions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references app_mealprep.households(id) on delete cascade,
  recipe_id     uuid not null references app_mealprep.recipes(id) on delete cascade,
  version_no    int  not null,
  base_servings int  not null default 4 check (base_servings > 0),
  cal           int  not null default 0 check (cal >= 0),
  protein_g     int  not null default 0 check (protein_g >= 0),
  carbs_g       int  not null default 0 check (carbs_g >= 0),
  fat_g         int  not null default 0 check (fat_g >= 0),
  steps         text[] not null default '{}',
  note          text not null default '',
  changes       text[] not null default '{}',
  created_by    uuid references app_mealprep.members(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint recipe_versions_no_unique unique (recipe_id, version_no)
);

create index if not exists recipe_versions_recipe_idx on app_mealprep.recipe_versions(recipe_id);

alter table app_mealprep.recipes
  drop constraint if exists recipes_current_version_fk;
alter table app_mealprep.recipes
  add constraint recipes_current_version_fk
  foreign key (current_version_id) references app_mealprep.recipe_versions(id) on delete set null;

create table if not exists app_mealprep.recipe_version_ingredients (
  version_id    uuid not null references app_mealprep.recipe_versions(id) on delete cascade,
  ingredient_id uuid not null references app_mealprep.ingredients(id) on delete restrict,
  qty           numeric(10, 3) not null check (qty > 0),
  unit          app_mealprep.unit not null,
  sort_order    int not null default 0,
  primary key (version_id, ingredient_id, unit)
);

-- ---------------------------------------------------------------------
-- Weeks
-- ---------------------------------------------------------------------

create table if not exists app_mealprep.weeks (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references app_mealprep.households(id) on delete cascade,
  start_date     date not null,
  snacks_enabled boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint weeks_start_unique unique (household_id, start_date),
  constraint weeks_start_is_monday check (extract(isodow from start_date) = 1)
);

create table if not exists app_mealprep.week_slots (
  week_id   uuid not null references app_mealprep.weeks(id) on delete cascade,
  day       app_mealprep.weekday not null,
  meal      app_mealprep.meal_type not null,
  member_id uuid not null references app_mealprep.members(id) on delete cascade,
  eating    boolean not null default true,
  primary key (week_id, day, meal, member_id)
);

-- version_id pins the recipe as it was when it went on the menu, so a later
-- tweak cannot change an already-planned week (MENU-7).
create table if not exists app_mealprep.week_picks (
  id         uuid primary key default gen_random_uuid(),
  week_id    uuid not null references app_mealprep.weeks(id) on delete cascade,
  meal       app_mealprep.meal_type not null,
  recipe_id  uuid not null references app_mealprep.recipes(id) on delete cascade,
  version_id uuid not null references app_mealprep.recipe_versions(id) on delete restrict,
  portions   int  not null check (portions > 0),
  sort_order int  not null default 0,
  constraint week_picks_one_per_recipe unique (week_id, meal, recipe_id)
);

create index if not exists week_picks_week_idx on app_mealprep.week_picks(week_id);

create table if not exists app_mealprep.week_pantry_checks (
  week_id       uuid not null references app_mealprep.weeks(id) on delete cascade,
  ingredient_id uuid not null references app_mealprep.ingredients(id) on delete cascade,
  have          boolean not null default false,
  primary key (week_id, ingredient_id)
);

create table if not exists app_mealprep.week_extras (
  id         uuid primary key default gen_random_uuid(),
  week_id    uuid not null references app_mealprep.weeks(id) on delete cascade,
  name       text not null,
  aisle      app_mealprep.aisle not null default 'Other',
  created_by uuid references app_mealprep.members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists week_extras_week_idx on app_mealprep.week_extras(week_id);

-- item_key is "<ingredient_id>|<unit>" for recipe items, "x:<extra_id>" for extras.
create table if not exists app_mealprep.week_list_checks (
  week_id  uuid not null references app_mealprep.weeks(id) on delete cascade,
  item_key text not null,
  checked  boolean not null default false,
  primary key (week_id, item_key)
);

create table if not exists app_mealprep.week_prep_status (
  week_id uuid not null references app_mealprep.weeks(id) on delete cascade,
  pick_id uuid not null references app_mealprep.week_picks(id) on delete cascade,
  done    boolean not null default false,
  primary key (week_id, pick_id)
);

-- ---------------------------------------------------------------------
-- Creating a week on demand
-- ---------------------------------------------------------------------

-- Called the first time someone opens Plan for a week that does not exist
-- yet. Creates the week and all 40 slots switched on, in one transaction.
create or replace function app_mealprep.ensure_week(p_start_date date)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household uuid := app_mealprep.current_household_id();
  v_week_id   uuid;
  v_snacks    boolean;
begin
  if v_household is null then
    raise exception 'not a member of any household';
  end if;

  select id into v_week_id
  from app_mealprep.weeks
  where household_id = v_household and start_date = p_start_date;

  if v_week_id is not null then
    return v_week_id;
  end if;

  select coalesce((settings -> 'snacksDefault')::boolean, true) into v_snacks
  from app_mealprep.households where id = v_household;

  insert into app_mealprep.weeks (household_id, start_date, snacks_enabled)
  values (v_household, p_start_date, coalesce(v_snacks, true))
  returning id into v_week_id;

  insert into app_mealprep.week_slots (week_id, day, meal, member_id, eating)
  select v_week_id, d.day, m.meal, mem.id, true
  from unnest(enum_range(null::app_mealprep.weekday)) as d(day)
  cross join unnest(enum_range(null::app_mealprep.meal_type)) as m(meal)
  cross join (select id from app_mealprep.members where household_id = v_household) as mem;

  return v_week_id;
end;
$$;

grant execute on function app_mealprep.ensure_week(date) to authenticated;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------

-- Every table is readable and writable only by members of its household.
-- Tables that hang off a week reach the household through that week.
do $$
declare
  t text;
begin
  foreach t in array array[
    'households', 'members', 'ingredients', 'recipes', 'recipe_versions',
    'recipe_version_ingredients', 'weeks', 'week_slots', 'week_picks',
    'week_pantry_checks', 'week_extras', 'week_list_checks', 'week_prep_status'
  ]
  loop
    -- Enabled, not forced: PostgREST never connects as the table owner, and
    -- forcing it would block the seed at the bottom of this file.
    execute format('alter table app_mealprep.%I enable row level security', t);
  end loop;
end $$;

-- Direct household_id tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'ingredients', 'recipes', 'recipe_versions', 'weeks'
  ]
  loop
    execute format('drop policy if exists household_all on app_mealprep.%I', t);
    execute format($f$
      create policy household_all on app_mealprep.%I
        for all to authenticated
        using (household_id = app_mealprep.current_household_id())
        with check (household_id = app_mealprep.current_household_id())
    $f$, t);
  end loop;
end $$;

-- Tables reached through a week.
do $$
declare
  t text;
begin
  foreach t in array array[
    'week_slots', 'week_picks', 'week_pantry_checks', 'week_extras',
    'week_list_checks', 'week_prep_status'
  ]
  loop
    execute format('drop policy if exists household_all on app_mealprep.%I', t);
    execute format($f$
      create policy household_all on app_mealprep.%I
        for all to authenticated
        using (exists (
          select 1 from app_mealprep.weeks w
          where w.id = week_id and w.household_id = app_mealprep.current_household_id()
        ))
        with check (exists (
          select 1 from app_mealprep.weeks w
          where w.id = week_id and w.household_id = app_mealprep.current_household_id()
        ))
    $f$, t);
  end loop;
end $$;

-- Reached through a recipe version.
drop policy if exists household_all on app_mealprep.recipe_version_ingredients;
create policy household_all on app_mealprep.recipe_version_ingredients
  for all to authenticated
  using (exists (
    select 1 from app_mealprep.recipe_versions v
    where v.id = version_id and v.household_id = app_mealprep.current_household_id()
  ))
  with check (exists (
    select 1 from app_mealprep.recipe_versions v
    where v.id = version_id and v.household_id = app_mealprep.current_household_id()
  ));

-- The household row itself: readable and settings-editable, never created
-- or deleted from the app.
drop policy if exists household_read on app_mealprep.households;
create policy household_read on app_mealprep.households
  for select to authenticated
  using (id = app_mealprep.current_household_id());

drop policy if exists household_update on app_mealprep.households;
create policy household_update on app_mealprep.households
  for update to authenticated
  using (id = app_mealprep.current_household_id())
  with check (id = app_mealprep.current_household_id());

-- Members: both people are visible to each other. Only the signed-in
-- person's own row can be updated, which is how user_id gets filled in on
-- first sign-in. No inserts or deletes from the app.
drop policy if exists members_read on app_mealprep.members;
create policy members_read on app_mealprep.members
  for select to authenticated
  using (household_id = app_mealprep.current_household_id());

drop policy if exists members_update_self on app_mealprep.members;
create policy members_update_self on app_mealprep.members
  for update to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------

-- Usage on the schema is not enough: PostgREST also needs table
-- privileges, and row level security is what actually limits the rows.
grant select, insert, update, delete on all tables in schema app_mealprep to authenticated;
grant usage, select on all sequences in schema app_mealprep to authenticated;

-- Anonymous visitors get nothing. Sign-in is required.
revoke all on all tables in schema app_mealprep from anon;

alter default privileges in schema app_mealprep
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema app_mealprep
  grant usage, select on sequences to authenticated;

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------

-- Both phones see each other's changes within a few seconds. Only the
-- tables that change during planning need this.
do $$
declare
  t text;
begin
  foreach t in array array[
    'recipes', 'recipe_versions', 'recipe_version_ingredients', 'ingredients',
    'weeks', 'week_slots', 'week_picks', 'week_pantry_checks',
    'week_extras', 'week_list_checks', 'week_prep_status'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table app_mealprep.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- The household and its two members
-- ---------------------------------------------------------------------

insert into app_mealprep.households (name, settings)
select
  'Shiva and Doreen',
  jsonb_build_object(
    'snacksDefault', true,
    'freezeDays', jsonb_build_array('Thu', 'Fri'),
    'prepDay', 'Sunday',
    'macroThresholds', jsonb_build_object('protein', 35, 'carbs', 45, 'fat', 35)
  )
where not exists (select 1 from app_mealprep.households);

-- Replace the second email before running.
insert into app_mealprep.members (household_id, email, display_name, initial, sort_order)
select h.id, m.email, m.display_name, m.initial, m.sort_order
from app_mealprep.households h
cross join (values
  ('esh1991@gmail.com', 'Shiva',  'S', 0),
  ('doreen@example.com', 'Doreen', 'D', 1)
) as m(email, display_name, initial, sort_order)
on conflict (email) do nothing;
