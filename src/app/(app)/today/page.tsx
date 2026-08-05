import Link from "next/link";
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatPace } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import { sortGoalsByRaceDate } from "@/lib/goals";
import { getUserTimeZone } from "@/lib/timezone";
import type { FitnessSnapshot, Goal, Run, Workout } from "@/lib/types";
import Greeting from "./greeting";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, first_name, units")
    .eq("id", user!.id)
    .single();
  const units = profile?.units ?? "mi";

  if (!profile?.onboarded_at) {
    return (
      <div className="space-y-4">
        <Greeting firstName={profile?.first_name ?? null} />
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">
            No goal set yet. Tell us your race and current fitness so the
            plan has something to build from.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950"
          >
            Set up training
          </Link>
        </div>
        <p className="text-sm text-zinc-500">
          You can log runs at any time from the{" "}
          <Link href="/log" className="underline">
            Log
          </Link>{" "}
          tab, with or without a goal set.
        </p>
      </div>
    );
  }

  const now = toZonedTime(new Date(), await getUserTimeZone());
  const todayIso = format(now, "yyyy-MM-dd");
  const weekStartIso = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEndIso = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [
    { data: activeGoals },
    { data: snapshot },
    { data: todaysWorkout },
    { data: todaysRuns },
    { data: weekRuns },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("is_active", true).returns<Goal[]>(),
    supabase
      .from("fitness_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<FitnessSnapshot[]>()
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("*")
      .eq("scheduled_date", todayIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<Workout[]>()
      .maybeSingle(),
    supabase
      .from("runs")
      .select("*")
      .eq("run_date", todayIso)
      .order("created_at", { ascending: false })
      .returns<Run[]>(),
    supabase
      .from("runs")
      .select("distance_mi")
      .gte("run_date", weekStartIso)
      .lte("run_date", weekEndIso)
      .returns<{ distance_mi: number }[]>(),
  ]);

  const weekMiles = (weekRuns ?? []).reduce((sum, r) => sum + r.distance_mi, 0);

  const [goal, nextGoal] = sortGoalsByRaceDate(activeGoals ?? []);

  const daysUntilRace = goal
    ? differenceInCalendarDays(parseISO(goal.race_date), now)
    : null;
  const daysUntilLabel =
    daysUntilRace === null
      ? null
      : daysUntilRace > 1
        ? `${daysUntilRace} days to go`
        : daysUntilRace === 1
          ? "1 day to go"
          : daysUntilRace === 0
            ? "Race day"
            : "Race complete";

  return (
    <div className="space-y-6">
      <div>
        <Greeting firstName={profile?.first_name ?? null} />
        {goal && (
          <p className="mt-1 text-sm text-zinc-400">
            {goal.race_name} · {goal.race_date}
            {daysUntilLabel && (
              <>
                {" · "}
                <span
                  className={
                    daysUntilRace !== null && daysUntilRace <= 0
                      ? "text-zinc-400"
                      : "font-medium text-zinc-200"
                  }
                >
                  {daysUntilLabel}
                </span>
              </>
            )}
          </p>
        )}
        {nextGoal && (
          <p className="mt-0.5 text-xs text-zinc-500">
            Next up: {nextGoal.race_name} · {nextGoal.race_date}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          This week
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">
          {formatDistance(weekMiles, units)}
        </p>
      </div>

      {todaysRuns && todaysRuns.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Today&apos;s run
          </p>
          {todaysRuns.map((run) => (
            <div
              key={run.id}
              className="rounded-lg border border-emerald-900 bg-emerald-950/20 p-4"
            >
              <p className="text-lg font-semibold capitalize text-zinc-100">
                {run.run_type} · {formatDistance(run.distance_mi, units)}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {formatDuration(run.duration_sec)} ·{" "}
                {formatPace(run.duration_sec / run.distance_mi, units)}
                {run.avg_hr ? ` · ${run.avg_hr} bpm` : ""} · felt {run.felt}
              </p>
              {run.notes && (
                <p className="mt-2 text-sm text-zinc-300">{run.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {snapshot ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Current fitness
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">
            {formatDuration(snapshot.predicted_race_sec)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            predicted at{" "}
            {goal ? formatDistance(goal.race_distance_mi, units) : "goal"}, VDOT{" "}
            {snapshot.vdot.toFixed(1)}
          </p>
          {goal?.goal_time_sec && (
            <p className="mt-3 text-sm text-zinc-300">
              Goal is {formatDuration(goal.goal_time_sec)} —{" "}
              {snapshot.on_track ? (
                <span className="text-emerald-400">on track</span>
              ) : (
                <span className="text-amber-400">
                  {formatDuration(Math.abs(snapshot.gap_sec))}{" "}
                  {snapshot.gap_sec > 0 ? "behind" : "ahead"}
                </span>
              )}
            </p>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            {formatDistance(snapshot.weekly_miles, units)}/week baseline
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">
            No fitness snapshot yet — log a recent race time or mile pace
            estimate to get a prediction.
          </p>
        </div>
      )}

      {todaysWorkout ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Today&apos;s workout
          </p>
          <p className="mt-2 text-lg font-semibold capitalize text-zinc-100">
            {todaysWorkout.run_type} ·{" "}
            {formatDistance(todaysWorkout.target_distance_mi, units)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {formatPace(todaysWorkout.target_pace_low_s, units)}–
            {formatPace(todaysWorkout.target_pace_high_s, units)}
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            {todaysWorkout.description}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">
            No workout prescribed for today. Generate this week&apos;s plan
            from the{" "}
            <Link href="/coach" className="underline">
              Coach
            </Link>{" "}
            tab, or keep logging runs from{" "}
            <Link href="/log" className="underline">
              Log
            </Link>
            .
          </p>
        </div>
      )}

      {(!todaysRuns || todaysRuns.length === 0) && (
        <Link
          href="/log"
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950"
        >
          Log your run
        </Link>
      )}
    </div>
  );
}
