import { endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { rollingEf } from "@/lib/training/ef";
import { convertMilesForDisplay } from "@/lib/units";
import { sortGoalsByRaceDate } from "@/lib/goals";
import { getUserTimeZone } from "@/lib/timezone";
import type { FitnessSnapshot, Goal, Run } from "@/lib/types";
import ProgressCharts from "./progress-charts";

const WEEKS_OF_HISTORY = 8;

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, units")
    .eq("id", user!.id)
    .single();
  const units = profile?.units ?? "mi";

  if (!profile?.onboarded_at) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-zinc-100">Progress</h1>
        <p className="text-sm text-zinc-400">
          Set up your goal and baseline first — there&apos;s nothing to chart yet.
        </p>
      </div>
    );
  }

  const now = toZonedTime(new Date(), await getUserTimeZone());
  const historyStartIso = format(
    startOfWeek(subWeeks(now, WEEKS_OF_HISTORY - 1), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );

  const [{ data: activeGoals }, { data: snapshots }, { data: runs }] = await Promise.all([
    supabase.from("goals").select("*").eq("is_active", true).returns<Goal[]>(),
    supabase
      .from("fitness_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<FitnessSnapshot[]>(),
    supabase
      .from("runs")
      .select("*")
      .gte("run_date", historyStartIso)
      .order("run_date", { ascending: true })
      .returns<Run[]>(),
  ]);

  const [goal] = sortGoalsByRaceDate(activeGoals ?? []);

  // One point per day — later snapshots on the same day win.
  const snapshotByDate = new Map<string, FitnessSnapshot>();
  for (const s of snapshots ?? []) snapshotByDate.set(s.snapshot_date, s);
  const finishSeries = Array.from(snapshotByDate.values())
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((s) => ({
      date: s.snapshot_date,
      predictedSec: s.predicted_race_sec,
    }));

  const weeklyMileage: { weekLabel: string; miles: number }[] = [];
  const efTrend: { weekLabel: string; ef: number | null }[] = [];

  for (let i = WEEKS_OF_HISTORY - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekStartIso = format(weekStart, "yyyy-MM-dd");
    const weekEndIso = format(weekEnd, "yyyy-MM-dd");
    const weekLabel = format(weekStart, "MMM d");

    const weekRuns = (runs ?? []).filter(
      (r) => r.run_date >= weekStartIso && r.run_date <= weekEndIso,
    );

    const miles = weekRuns.reduce((sum, r) => sum + r.distance_mi, 0);
    const displayMiles = convertMilesForDisplay(miles, units);
    weeklyMileage.push({ weekLabel, miles: Math.round(displayMiles * 10) / 10 });

    const easySamples = weekRuns
      .filter((r) => r.run_type === "easy" && r.avg_hr !== null)
      .map((r) => ({
        distanceMi: r.distance_mi,
        durationSec: r.duration_sec,
        avgHr: r.avg_hr!,
      }));
    efTrend.push({
      weekLabel,
      ef: easySamples.length > 0 ? rollingEf(easySamples) : null,
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-zinc-100">Progress</h1>
      <ProgressCharts
        finishSeries={finishSeries}
        goalTimeSec={goal?.goal_type === "time" ? goal.goal_time_sec : null}
        weeklyMileage={weeklyMileage}
        efTrend={efTrend}
        units={units}
      />
    </div>
  );
}
