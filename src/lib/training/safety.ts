import type { Felt, RunType } from "@/lib/types";

const HARD_RUN_TYPES: RunType[] = ["tempo", "interval", "race"];

export function computeMaxSafeMiles(params: {
  currentWeeklyMiles: number;
  baselineWeeklyMiles: number;
  weeksIntoBlock: number;
  hadRoughHardRun: boolean;
}): number {
  const effectiveBase = Math.max(
    params.currentWeeklyMiles,
    params.baselineWeeklyMiles,
  );
  if (effectiveBase === 0) return 15;

  const growthFactor = params.hadRoughHardRun ? 1.05 : 1.1;
  const base =
    params.currentWeeklyMiles > 0
      ? params.currentWeeklyMiles
      : params.baselineWeeklyMiles;
  let cap = base * growthFactor;

  if (params.weeksIntoBlock <= 4 && params.baselineWeeklyMiles > 0) {
    cap = Math.min(cap, params.baselineWeeklyMiles * 1.1);
  }

  return cap;
}

export function clampTargetMiles(targetMiles: number, maxSafeMiles: number): number {
  return Math.min(targetMiles, maxSafeMiles);
}

const MAX_LONG_RUN_SHARE = 0.35;

/** The long run never exceeds 35% of the week's total volume. */
export function clampLongRunMiles(
  longRunMiles: number,
  weeklyTargetMiles: number,
): number {
  return Math.min(longRunMiles, weeklyTargetMiles * MAX_LONG_RUN_SHARE);
}

export interface PlannedDay {
  scheduledDate: string;
  runType: RunType;
}

export function isHardRunType(runType: RunType): boolean {
  return HARD_RUN_TYPES.includes(runType);
}

/** True if any two hard sessions land on consecutive calendar days. */
export function hasBackToBackHardDays(workouts: PlannedDay[]): boolean {
  const hardDates = workouts
    .filter((w) => isHardRunType(w.runType))
    .map((w) => new Date(w.scheduledDate).getTime())
    .sort((a, b) => a - b);

  const oneDayMs = 24 * 60 * 60 * 1000;
  for (let i = 1; i < hardDates.length; i++) {
    if (hardDates[i] - hardDates[i - 1] === oneDayMs) return true;
  }
  return false;
}

export function exceedsHardSessionLimit(workouts: PlannedDay[]): boolean {
  return workouts.filter((w) => isHardRunType(w.runType)).length > 2;
}

/** Three consecutive `bad` runs, most recent last, means refuse to add volume. */
export function hasThreeConsecutiveBadRuns(recentFeltMostRecentLast: Felt[]): boolean {
  const last3 = recentFeltMostRecentLast.slice(-3);
  return last3.length === 3 && last3.every((f) => f === "bad");
}
