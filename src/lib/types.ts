export type RunType = "easy" | "long" | "tempo" | "interval" | "recovery" | "race";
export type Felt = "great" | "good" | "ok" | "rough" | "bad";

export interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  accent_color: string | null;
  units: "mi" | "km";
  birth_year: number | null;
  date_of_birth: string | null;
  resting_hr: number | null;
  max_hr: number | null;
  onboarded_at: string | null;
  accepted_disclaimer_at: string | null;
  created_at: string;
}

export interface Run {
  id: string;
  user_id: string;
  run_date: string;
  distance_mi: number;
  duration_sec: number;
  avg_hr: number | null;
  max_hr: number | null;
  elevation_gain_ft: number | null;
  rpe: number;
  run_type: RunType;
  felt: Felt;
  notes: string | null;
  planned_workout_id: string | null;
  created_at: string;
}

export const RUN_TYPES: RunType[] = [
  "easy",
  "long",
  "tempo",
  "interval",
  "recovery",
  "race",
];

export const FELT_OPTIONS: Felt[] = ["great", "good", "ok", "rough", "bad"];

export interface Goal {
  id: string;
  user_id: string;
  race_name: string;
  race_date: string;
  race_distance_mi: number;
  goal_time_sec: number | null;
  goal_type: "finish" | "time";
  is_active: boolean;
  created_at: string;
}

export interface RaceCatalogEntry {
  id: string;
  race_name: string;
  race_date: string;
  race_distance_mi: number;
  city: string | null;
  is_major: boolean;
  created_at: string;
}

export interface FitnessSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  vdot: number;
  predicted_race_sec: number;
  weekly_miles: number;
  acwr: number;
  on_track: boolean;
  gap_sec: number;
  created_at: string;
}

export const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export interface Baseline {
  id: string;
  user_id: string;
  weekly_miles: number;
  longest_recent_run: number;
  days_per_week: number;
  preferred_days: DayOfWeek[] | null;
  est_mile_pace_sec: number | null;
  recent_race_dist: number | null;
  recent_race_time_s: number | null;
  injury_notes: string | null;
  created_at: string;
}

export type Phase = "base" | "build" | "peak" | "taper" | "race";

export interface PlanWeek {
  id: string;
  user_id: string;
  week_start: string;
  week_index: number;
  phase: Phase;
  target_miles: number;
  is_deload: boolean;
  generated_at: string;
  generation_reason: string | null;
  created_at: string;
}

export type WorkoutStatus = "planned" | "completed" | "skipped" | "modified";

export interface Workout {
  id: string;
  user_id: string;
  plan_week_id: string;
  scheduled_date: string;
  run_type: RunType;
  target_distance_mi: number;
  target_pace_low_s: number;
  target_pace_high_s: number;
  description: string;
  status: WorkoutStatus;
  created_at: string;
}

export type CoachMessageRole = "assessment" | "weekly_note" | "warning";

export interface CoachMessage {
  id: string;
  user_id: string;
  snapshot_id: string | null;
  role: CoachMessageRole;
  body: string;
  created_at: string;
}
