import type { DayOfWeek, RunType } from "@/lib/types";

export const TOUR_GOAL = {
  raceName: "Chicago Marathon",
  raceDate: "2026-10-11",
  distanceMi: 26.2,
  goalTimeSec: 13500, // 3:45:00
};

export const TOUR_UPCOMING_GOAL = {
  raceName: "Turkey Trot 10K",
  raceDate: "2026-11-26",
  distanceMi: 6.2,
};

export const TOUR_SNAPSHOT = {
  predictedRaceSec: 13680, // 3:48:00 — slightly behind goal, an honest showcase
  vdot: 48.2,
  gapSec: 180, // behind by 3:00
  weeklyMiles: 34,
};

export const TOUR_TODAY_WORKOUT = {
  runType: "tempo" as RunType,
  targetDistanceMi: 6,
  targetPaceLowSec: 435, // 7:15/mi
  targetPaceHighSec: 450, // 7:30/mi
  description: "2mi warmup, 4mi @ tempo effort, 1mi cooldown.",
};

export const TOUR_WEEKLY_MILEAGE = [
  { weekLabel: "Jun 1", miles: 22 },
  { weekLabel: "Jun 8", miles: 25 },
  { weekLabel: "Jun 15", miles: 27 },
  { weekLabel: "Jun 22", miles: 24 },
  { weekLabel: "Jun 29", miles: 29 },
  { weekLabel: "Jul 6", miles: 31 },
  { weekLabel: "Jul 13", miles: 33 },
  { weekLabel: "Jul 20", miles: 34 },
];

export const TOUR_FINISH_SERIES = [
  { date: "2026-06-01", predictedSec: 14100 },
  { date: "2026-06-08", predictedSec: 14010 },
  { date: "2026-06-15", predictedSec: 13940 },
  { date: "2026-06-22", predictedSec: 13920 },
  { date: "2026-06-29", predictedSec: 13830 },
  { date: "2026-07-06", predictedSec: 13760 },
  { date: "2026-07-13", predictedSec: 13700 },
  { date: "2026-07-20", predictedSec: 13680 },
];

export const TOUR_EF_TREND = [
  { weekLabel: "Jun 1", ef: 0.0148 },
  { weekLabel: "Jun 8", ef: 0.015 },
  { weekLabel: "Jun 15", ef: 0.0151 },
  { weekLabel: "Jun 22", ef: 0.015 },
  { weekLabel: "Jun 29", ef: 0.0153 },
  { weekLabel: "Jul 6", ef: 0.0155 },
  { weekLabel: "Jul 13", ef: 0.0157 },
  { weekLabel: "Jul 20", ef: 0.0158 },
];

export const TOUR_ASSESSMENT =
  "You're about three minutes off your goal pace right now, which is close enough that it's not a concern yet. Your last four weeks have held steady around 30 to 34 miles, and your easy-run efficiency has been trending up, so the aerobic work is paying off. This week keeps the tempo effort where it's been rather than pushing it further — there's no need to force fitness you're already building. Stay consistent through the next two build weeks and the gap should keep closing on its own.";

export const TOUR_FOCUS = "Hold current volume, let tempo pace sharpen naturally.";

export const TOUR_PROFILE = {
  firstName: "Alex",
  units: "mi" as const,
  preferredDays: ["mon", "wed", "fri", "sat"] as DayOfWeek[],
};

export const TOUR_PLAN_WEEK = {
  phase: "build" as const,
  targetMiles: 34,
  isDeload: false,
};

export const TOUR_WEEK_WORKOUTS: {
  day: string;
  runType: RunType;
  distanceMi: number | null;
}[] = [
  { day: "Mon", runType: "recovery", distanceMi: 3 },
  { day: "Tue", runType: "easy", distanceMi: 5 },
  { day: "Wed", runType: "tempo", distanceMi: 6 },
  { day: "Thu", runType: "easy", distanceMi: 4 },
  { day: "Fri", runType: "recovery", distanceMi: null },
  { day: "Sat", runType: "long", distanceMi: 12 },
  { day: "Sun", runType: "easy", distanceMi: 4 },
];
