import type { Goal } from "@/lib/types";

/** Soonest race first. The AI coach and training math always focus on goals[0]. */
export function sortGoalsByRaceDate(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => a.race_date.localeCompare(b.race_date));
}
