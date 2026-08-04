export type DayStatus = "workout" | "rest" | "no_plan" | "before_history";

export interface PlanWeekRange {
  start: string;
  end: string;
}

/**
 * A day only counts as a designed "rest day" if it falls inside a week that
 * was actually generated. Days outside any generated plan are either
 * "before_history" (before the athlete's first logged run — nothing to show)
 * or "no_plan" (a real gap where no plan has been generated yet).
 */
export function computeDayStatus(params: {
  iso: string;
  hasWorkout: boolean;
  planWeekRanges: PlanWeekRange[];
  firstRunDate: string | null;
}): DayStatus {
  const inGeneratedWeek = params.planWeekRanges.some(
    (r) => params.iso >= r.start && params.iso <= r.end,
  );
  if (inGeneratedWeek) {
    return params.hasWorkout ? "workout" : "rest";
  }
  if (params.firstRunDate && params.iso < params.firstRunDate) {
    return "before_history";
  }
  return "no_plan";
}
