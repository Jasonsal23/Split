-- Full date of birth (replaces the birth_year-only capture) and a specific
-- day-of-week availability list (replaces the plain days_per_week count).
alter table profiles add column if not exists date_of_birth date;
alter table baselines add column if not exists preferred_days text[];
