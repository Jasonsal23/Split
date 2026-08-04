-- Shared, crowdsourced race directory. Any signed-in athlete can read the
-- whole list and contribute new races when they add a goal; there is no
-- per-user ownership (auth.uid() = user_id) because this data isn't private —
-- it's the opposite, the more athletes contribute, the more useful it gets
-- for everyone else searching for the same event.
create table if not exists race_catalog (
  id uuid primary key default gen_random_uuid(),
  race_name text not null,
  race_date date not null,
  race_distance_mi numeric not null,
  city text,
  is_major bool not null default false,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique (race_name, race_date)
);

create index if not exists race_catalog_name_idx on race_catalog (race_name);
create index if not exists race_catalog_date_idx on race_catalog (race_date);

alter table race_catalog enable row level security;

-- Readable by any signed-in athlete.
create policy "race_catalog_read" on race_catalog
  for select using (auth.role() = 'authenticated');

-- Any signed-in athlete can contribute a new race, but nobody can edit or
-- delete an entry once it exists — keeps the shared list append-only and
-- safe from casual vandalism.
create policy "race_catalog_insert" on race_catalog
  for insert with check (auth.role() = 'authenticated');

-- Seed with the World Marathon Majors editions confirmed at the time this
-- migration was written. Dates only included here where officially
-- announced — no guessed dates. Add more as they're confirmed.
insert into race_catalog (race_name, race_date, race_distance_mi, city, is_major) values
  ('Sydney Marathon', '2026-08-30', 26.2, 'Sydney, Australia', true),
  ('Berlin Marathon', '2026-09-27', 26.2, 'Berlin, Germany', true),
  ('Chicago Marathon', '2026-10-11', 26.2, 'Chicago, USA', true),
  ('New York City Marathon', '2026-11-01', 26.2, 'New York, USA', true),
  ('Tokyo Marathon', '2027-03-07', 26.2, 'Tokyo, Japan', true),
  ('Boston Marathon', '2027-04-19', 26.2, 'Boston, USA', true),
  ('Chicago Marathon', '2027-10-10', 26.2, 'Chicago, USA', true)
on conflict (race_name, race_date) do nothing;
