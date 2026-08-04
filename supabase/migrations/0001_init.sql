-- Pacer schema: profiles, baselines, goals, runs, plan_weeks, workouts,
-- fitness_snapshots, coach_messages. RLS on every table: auth.uid() = user_id.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  units text not null default 'mi' check (units in ('mi', 'km')),
  birth_year int,
  resting_hr int,
  max_hr int,
  onboarded_at timestamptz,
  accepted_disclaimer_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists baselines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  weekly_miles numeric not null,
  longest_recent_run numeric not null,
  days_per_week int not null,
  est_mile_pace_sec int,
  recent_race_dist numeric,
  recent_race_time_s int,
  injury_notes text,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  race_name text not null,
  race_date date not null,
  race_distance_mi numeric not null,
  goal_time_sec int,
  goal_type text not null check (goal_type in ('finish', 'time')),
  is_active bool not null default true,
  created_at timestamptz not null default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  run_date date not null,
  distance_mi numeric not null,
  duration_sec int not null,
  avg_hr int,
  max_hr int,
  elevation_gain_ft int,
  rpe int not null check (rpe between 1 and 10),
  run_type text not null check (run_type in ('easy', 'long', 'tempo', 'interval', 'recovery', 'race')),
  felt text not null check (felt in ('great', 'good', 'ok', 'rough', 'bad')),
  notes text,
  planned_workout_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists plan_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_start date not null,
  week_index int not null,
  phase text not null check (phase in ('base', 'build', 'peak', 'taper', 'race')),
  target_miles numeric not null,
  is_deload bool not null default false,
  generated_at timestamptz not null default now(),
  generation_reason text,
  created_at timestamptz not null default now()
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  plan_week_id uuid not null references plan_weeks (id) on delete cascade,
  scheduled_date date not null,
  run_type text not null check (run_type in ('easy', 'long', 'tempo', 'interval', 'recovery', 'race')),
  target_distance_mi numeric not null,
  target_pace_low_s int not null,
  target_pace_high_s int not null,
  description text not null,
  status text not null default 'planned' check (status in ('planned', 'completed', 'skipped', 'modified')),
  created_at timestamptz not null default now()
);

alter table runs
  add constraint runs_planned_workout_id_fkey
  foreign key (planned_workout_id) references workouts (id) on delete set null;

create table if not exists fitness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  snapshot_date date not null,
  vdot numeric not null,
  predicted_race_sec int not null,
  weekly_miles numeric not null,
  acwr numeric not null,
  on_track bool not null,
  gap_sec int not null,
  created_at timestamptz not null default now()
);

create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  snapshot_id uuid references fitness_snapshots (id) on delete set null,
  role text not null check (role in ('assessment', 'weekly_note', 'warning')),
  body text not null,
  created_at timestamptz not null default now()
);

-- Indexes for the lookups the app actually does.
create index if not exists runs_user_date_idx on runs (user_id, run_date desc);
create index if not exists workouts_user_date_idx on workouts (user_id, scheduled_date);
create index if not exists plan_weeks_user_week_idx on plan_weeks (user_id, week_start);
create index if not exists fitness_snapshots_user_date_idx on fitness_snapshots (user_id, snapshot_date desc);

-- Row Level Security: every table, same policy shape.
alter table profiles enable row level security;
alter table baselines enable row level security;
alter table goals enable row level security;
alter table runs enable row level security;
alter table plan_weeks enable row level security;
alter table workouts enable row level security;
alter table fitness_snapshots enable row level security;
alter table coach_messages enable row level security;

create policy "profiles_owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "baselines_owner" on baselines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_owner" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "runs_owner" on runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plan_weeks_owner" on plan_weeks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workouts_owner" on workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "fitness_snapshots_owner" on fitness_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "coach_messages_owner" on coach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
