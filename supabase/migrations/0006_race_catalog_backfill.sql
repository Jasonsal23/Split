-- One-time backfill: races added before the shared catalog existed (0005)
-- never got contributed to it. New goals contribute automatically going
-- forward (see addGoal / completeOnboarding); this catches up existing ones.
insert into race_catalog (race_name, race_date, race_distance_mi, created_by)
select race_name, race_date, race_distance_mi, user_id
from goals
on conflict (race_name, race_date) do nothing;
