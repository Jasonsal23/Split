import { differenceInCalendarDays, format, subDays, subWeeks } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sortGoalsByRaceDate } from "@/lib/goals";
import { efTrendPct as computeEfTrendPct, rollingEf } from "@/lib/training/ef";
import {
  applyEfficiencyAdjustment,
  bestRaceEffort,
  computeFitnessSnapshot,
  type FitnessSnapshotResult,
  type RaceEffort,
  type RunForLoad,
} from "@/lib/training/snapshot";
import type { Baseline, Goal, Run } from "@/lib/types";

type SupabaseServerClient = SupabaseClient;

export interface SnapshotContext {
  goal: Goal;
  upcomingGoals: Goal[];
  baseline: Baseline;
  runs: Run[];
  effort: RaceEffort;
  currentWeeklyMiles: number;
  snapshot: FitnessSnapshotResult;
  efTrendPct: number;
}

export type SnapshotContextResult =
  | { ok: true; context: SnapshotContext }
  | { ok: false; reason: "no_goal" | "no_baseline" | "no_effort" };

/**
 * Pulls the goal/baseline/recent runs, picks the best race-prediction input,
 * and computes fresh fitness numbers — pure math, no AI call. Shared by the
 * AI plan-generation route and the plain "log a run" flow, since the latter
 * shouldn't need to spend an AI call just to refresh these numbers.
 */
export async function buildSnapshotContext(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<SnapshotContextResult> {
  const { data: activeGoals } = await supabase
    .from("goals")
    .select("*")
    .eq("is_active", true)
    .returns<Goal[]>();
  const sortedGoals = sortGoalsByRaceDate(activeGoals ?? []);
  const [goal, ...upcomingGoals] = sortedGoals;
  if (!goal) return { ok: false, reason: "no_goal" };

  const { data: baseline } = await supabase
    .from("baselines")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<Baseline[]>()
    .maybeSingle();
  if (!baseline) return { ok: false, reason: "no_baseline" };

  const today = new Date();
  const sixtyDaysAgo = format(subDays(today, 60), "yyyy-MM-dd");
  const { data: recentRuns } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .gte("run_date", sixtyDaysAgo)
    .order("run_date", { ascending: true })
    .returns<Run[]>();
  const runs = recentRuns ?? [];

  const loggedRace = [...runs].reverse().find((r) => r.run_type === "race");
  const hardEffortRun = [...runs]
    .filter((r) => r.run_type === "tempo" || r.run_type === "interval")
    .sort((a, b) => b.distance_mi - a.distance_mi)[0];

  const effort =
    (loggedRace && {
      distanceMi: loggedRace.distance_mi,
      timeSec: loggedRace.duration_sec,
    }) ??
    bestRaceEffort({
      recentRaceDistMi: baseline.recent_race_dist,
      recentRaceTimeSec: baseline.recent_race_time_s,
      estMilePaceSec: null,
    }) ??
    (hardEffortRun && {
      distanceMi: hardEffortRun.distance_mi,
      timeSec: hardEffortRun.duration_sec,
    }) ??
    bestRaceEffort({
      recentRaceDistMi: null,
      recentRaceTimeSec: null,
      estMilePaceSec: baseline.est_mile_pace_sec,
    });
  if (!effort) return { ok: false, reason: "no_effort" };

  const last7 = runs.filter(
    (r) => differenceInCalendarDays(today, new Date(r.run_date)) < 7,
  );
  const last28 = runs.filter(
    (r) => differenceInCalendarDays(today, new Date(r.run_date)) < 28,
  );
  const currentWeeklyMiles = last7.reduce((s, r) => s + r.distance_mi, 0);

  const runsForLoad: RunForLoad[] = last28.map((r) => ({
    runDate: r.run_date,
    distanceMi: r.distance_mi,
    runType: r.run_type,
  }));

  const baseSnapshot = computeFitnessSnapshot({
    bestEffort: effort,
    goalDistanceMi: goal.race_distance_mi,
    goalTimeSec: goal.goal_type === "time" ? goal.goal_time_sec : null,
    weeklyMiles: currentWeeklyMiles > 0 ? currentWeeklyMiles : baseline.weekly_miles,
    recentRuns: runsForLoad,
  });

  // Easy runs can't demonstrate a new fitness ceiling the way a race/tempo/
  // interval effort can, but they should still move the number — scaled to
  // the aerobic efficiency gain they actually showed.
  const withHr = runs.filter((r) => r.avg_hr !== null && r.run_type === "easy");
  const twoWeeksAgo = subWeeks(today, 2);
  const fourWeeksAgo = subWeeks(today, 4);
  const laterSamples = withHr
    .filter((r) => new Date(r.run_date) >= twoWeeksAgo)
    .map((r) => ({
      distanceMi: r.distance_mi,
      durationSec: r.duration_sec,
      avgHr: r.avg_hr!,
    }));
  const earlierSamples = withHr
    .filter(
      (r) =>
        new Date(r.run_date) < twoWeeksAgo && new Date(r.run_date) >= fourWeeksAgo,
    )
    .map((r) => ({
      distanceMi: r.distance_mi,
      durationSec: r.duration_sec,
      avgHr: r.avg_hr!,
    }));
  const efTrendPct =
    laterSamples.length > 0 && earlierSamples.length > 0
      ? computeEfTrendPct(rollingEf(earlierSamples), rollingEf(laterSamples))
      : 0;

  const snapshot = applyEfficiencyAdjustment(baseSnapshot, efTrendPct);

  return {
    ok: true,
    context: {
      goal,
      upcomingGoals,
      baseline,
      runs,
      effort,
      currentWeeklyMiles,
      snapshot,
      efTrendPct,
    },
  };
}

export async function persistSnapshot(
  supabase: SupabaseServerClient,
  userId: string,
  snapshot: FitnessSnapshotResult,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("fitness_snapshots")
    .insert({
      user_id: userId,
      snapshot_date: format(new Date(), "yyyy-MM-dd"),
      vdot: snapshot.vdot,
      predicted_race_sec: Math.round(snapshot.predictedRaceSec),
      weekly_miles: snapshot.weeklyMiles,
      acwr: snapshot.acwr,
      on_track: snapshot.onTrack,
      gap_sec: Math.round(snapshot.gapSec),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to save snapshot." };
  }
  return { id: data.id as string };
}
