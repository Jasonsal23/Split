import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { formatPace } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import type { Run, Workout } from "@/lib/types";
import { computeDayStatus, type PlanWeekRange } from "../day-status";
import RunEntry from "./run-entry";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: workout },
    { data: runs },
    { data: allPlanWeeks },
    { data: firstRun },
  ] = await Promise.all([
    supabase.from("profiles").select("units").eq("id", user!.id).single(),
    supabase
      .from("workouts")
      .select("*")
      .eq("scheduled_date", date)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<Workout[]>()
      .maybeSingle(),
    supabase
      .from("runs")
      .select("*")
      .eq("run_date", date)
      .order("created_at", { ascending: false })
      .returns<Run[]>(),
    supabase.from("plan_weeks").select("week_start").returns<{ week_start: string }[]>(),
    supabase
      .from("runs")
      .select("run_date")
      .order("run_date", { ascending: true })
      .limit(1)
      .returns<{ run_date: string }[]>()
      .maybeSingle(),
  ]);
  const units = profile?.units ?? "mi";

  const planWeekRanges: PlanWeekRange[] = (allPlanWeeks ?? []).map((w) => ({
    start: w.week_start,
    end: format(addDays(new Date(`${w.week_start}T00:00:00`), 6), "yyyy-MM-dd"),
  }));

  const status = computeDayStatus({
    iso: date,
    hasWorkout: Boolean(workout),
    planWeekRanges,
    firstRunDate: firstRun?.run_date ?? null,
  });

  const dayLabel = format(parseISO(date), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/plan" className="text-sm text-zinc-400 underline">
          ← Back to calendar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">{dayLabel}</h1>
      </div>

      {workout ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Prescribed workout
          </p>
          <p className="mt-2 text-lg font-semibold capitalize text-zinc-100">
            {workout.run_type} · {formatDistance(workout.target_distance_mi, units)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {formatPace(workout.target_pace_low_s, units)}–
            {formatPace(workout.target_pace_high_s, units)}
          </p>
          <p className="mt-2 text-sm text-zinc-300">{workout.description}</p>
          <p className="mt-3 text-xs capitalize text-zinc-500">
            Status: {workout.status}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">
            {status === "before_history"
              ? "This is before your first logged run — nothing to show."
              : status === "no_plan"
                ? "No plan has been generated for this week yet."
                : "Rest day — nothing prescribed."}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Logged runs
        </h2>
        {runs && runs.length > 0 ? (
          <div className="mt-3 space-y-3">
            {runs.map((run) => (
              <RunEntry key={run.id} run={run} units={units} />
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">No run logged for this day yet.</p>
            <Link
              href={`/log?date=${date}`}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950"
            >
              Log your run
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
