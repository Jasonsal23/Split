-- Target heart-rate range per workout, alongside the existing pace range.
-- Nullable: not every workout gets one — only computable when the athlete
-- has resting/max HR (or an age-based estimate) or real observed HR data.
alter table workouts add column if not exists target_hr_low int;
alter table workouts add column if not exists target_hr_high int;
