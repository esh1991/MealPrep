-- What each recipe import cost, so the running total is visible in the app
-- rather than only in the Anthropic console.
--
-- Tokens are stored rather than dollars: prices change, and the rate can be
-- applied when the total is displayed.

create table if not exists app_mealprep.api_usage (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references app_mealprep.households(id) on delete cascade,
  member_id     uuid references app_mealprep.members(id) on delete set null,
  kind          text not null,
  model         text not null,
  input_tokens  int not null default 0 check (input_tokens >= 0),
  output_tokens int not null default 0 check (output_tokens >= 0),
  ok            boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists api_usage_household_idx
  on app_mealprep.api_usage(household_id, created_at desc);

alter table app_mealprep.api_usage enable row level security;

drop policy if exists household_all on app_mealprep.api_usage;
create policy household_all on app_mealprep.api_usage
  for all to authenticated
  using (household_id = app_mealprep.current_household_id())
  with check (household_id = app_mealprep.current_household_id());

grant select, insert on app_mealprep.api_usage to authenticated;
