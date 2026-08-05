import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { formatPace } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import { getUserTimeZone } from "@/lib/timezone";
import type { PlanWeek, Run, RunType, Workout } from "@/lib/types";
import { computeDayStatus, type PlanWeekRange } from "./day-status";

const RUN_TYPE_COLOR: Record<RunType, string> = {
  easy: "bg-zinc-500",
  long: "bg-blue-500",
  tempo: "bg-amber-500",
  interval: "bg-orange-500",
  recovery: "bg-zinc-600",
  race: "bg-purple-500",
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; week?: string }>;
}) {
  const { view: viewParam, month: monthParam, week: weekParam } = await searchParams;
  const view = viewParam === "week" ? "week" : "month";

  const zonedNow = toZonedTime(new Date(), await getUserTimeZone());

  const anchorDate = monthParam
    ? new Date(`${monthParam}-01T00:00:00`)
    : weekParam
      ? new Date(`${weekParam}T00:00:00`)
      : zonedNow;

  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });

  const gridStart = view === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = view === "week" ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const gridStartIso = format(gridStart, "yyyy-MM-dd");
  const gridEndIso = format(gridEnd, "yyyy-MM-dd");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const todayWeekStartIso = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [
    { data: profile },
    { data: workouts },
    { data: runs },
    { data: currentPlanWeek },
    { data: allPlanWeeks },
    { data: firstRun },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("units")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("workouts")
      .select("*")
      .gte("scheduled_date", gridStartIso)
      .lte("scheduled_date", gridEndIso)
      .returns<Workout[]>(),
    supabase
      .from("runs")
      .select("*")
      .gte("run_date", gridStartIso)
      .lte("run_date", gridEndIso)
      .returns<Run[]>(),
    supabase
      .from("plan_weeks")
      .select("*")
      .eq("week_start", todayWeekStartIso)
      .returns<PlanWeek[]>()
      .maybeSingle(),
    supabase.from("plan_weeks").select("week_start").returns<{ week_start: string }[]>(),
    supabase
      .from("runs")
      .select("run_date")
      .order("run_date", { ascending: true })
      .limit(1)
      .returns<{ run_date: string }[]>()
      .maybeSingle(),
  ]);

  const workoutsByDate = new Map<string, Workout>();
  for (const w of workouts ?? []) {
    if (!workoutsByDate.has(w.scheduled_date)) workoutsByDate.set(w.scheduled_date, w);
  }
  const runsByDate = new Map<string, Run[]>();
  for (const r of runs ?? []) {
    const list = runsByDate.get(r.run_date) ?? [];
    list.push(r);
    runsByDate.set(r.run_date, list);
  }

  const units = profile?.units ?? "mi";

  const planWeekRanges: PlanWeekRange[] = (allPlanWeeks ?? []).map((w) => ({
    start: w.week_start,
    end: format(addDays(new Date(`${w.week_start}T00:00:00`), 6), "yyyy-MM-dd"),
  }));
  const firstRunDate = firstRun?.run_date ?? null;

  const prevHref =
    view === "week"
      ? `/plan?view=week&week=${format(subWeeks(weekStart, 1), "yyyy-MM-dd")}`
      : `/plan?view=month&month=${format(subMonths(monthStart, 1), "yyyy-MM")}`;
  const nextHref =
    view === "week"
      ? `/plan?view=week&week=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`
      : `/plan?view=month&month=${format(addMonths(monthStart, 1), "yyyy-MM")}`;

  const todayMonthStr = format(startOfMonth(zonedNow), "yyyy-MM");
  const todayWeekStr = format(startOfWeek(zonedNow, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const todayHref =
    view === "week"
      ? `/plan?view=week&week=${todayWeekStr}`
      : `/plan?view=month&month=${todayMonthStr}`;
  const isOnCurrentPeriod =
    view === "week" ? format(weekStart, "yyyy-MM-dd") === todayWeekStr : format(monthStart, "yyyy-MM") === todayMonthStr;

  const title =
    view === "week"
      ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
      : format(monthStart, "MMMM yyyy");

  return (
    <div className="space-y-4">
      {currentPlanWeek && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs text-zinc-400">
            This week: <span className="capitalize">{currentPlanWeek.phase}</span> ·{" "}
            {formatDistance(currentPlanWeek.target_miles, units)}
            {currentPlanWeek.is_deload && (
              <span className="text-amber-400"> · deload</span>
            )}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-md border border-zinc-800 p-0.5 text-xs">
          <Link
            href={`/plan?view=month&month=${todayMonthStr}`}
            className={`rounded px-3 py-1.5 font-medium ${
              view === "month" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400"
            }`}
          >
            Month
          </Link>
          <Link
            href={`/plan?view=week&week=${todayWeekStr}`}
            className={`rounded px-3 py-1.5 font-medium ${
              view === "week" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400"
            }`}
          >
            Week
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {!isOnCurrentPeriod && (
            <Link href={todayHref} className="text-xs font-medium text-zinc-400 underline">
              Today
            </Link>
          )}
          <div className="flex gap-2">
            <Link
              href={prevHref}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 text-zinc-400"
            >
              ‹
            </Link>
            <Link
              href={nextHref}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 text-zinc-400"
            >
              ›
            </Link>
          </div>
        </div>
      </div>

      <h1 className="text-xl font-semibold text-zinc-100">{title}</h1>

      {view === "week" ? (
        <div className="space-y-2">
          {days.map((day) => {
            const iso = format(day, "yyyy-MM-dd");
            const workout = workoutsByDate.get(iso);
            const dayRuns = runsByDate.get(iso) ?? [];
            const today = isSameDay(day, zonedNow);

            const status = computeDayStatus({
              iso,
              hasWorkout: Boolean(workout),
              planWeekRanges,
              firstRunDate,
            });

            return (
              <Link
                key={iso}
                href={`/plan/${iso}`}
                className={`block rounded-lg border p-4 ${
                  today ? "border-zinc-100" : "border-zinc-800"
                } bg-zinc-900`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-100">
                    {format(day, "EEEE")}{" "}
                    <span className="font-normal text-zinc-500">
                      · {format(day, "MMM d")}
                    </span>
                  </p>
                  {dayRuns.length > 0 && (
                    <span className="text-xs text-emerald-400">✓ logged</span>
                  )}
                </div>

                {status === "workout" && workout ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${RUN_TYPE_COLOR[workout.run_type]}`}
                    />
                    <p className="text-sm capitalize text-zinc-300">
                      {workout.run_type} ·{" "}
                      {formatDistance(workout.target_distance_mi, units)} ·{" "}
                      {formatPace(workout.target_pace_low_s, units)}–
                      {formatPace(workout.target_pace_high_s, units)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    {status === "rest"
                      ? "Rest day"
                      : status === "no_plan"
                        ? "No plan generated yet"
                        : "N/A"}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-zinc-500">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const workout = workoutsByDate.get(iso);
              const dayRuns = runsByDate.get(iso) ?? [];
              const inMonth = isSameMonth(day, monthStart);
              const today = isSameDay(day, zonedNow);

              const status = computeDayStatus({
                iso,
                hasWorkout: Boolean(workout),
                planWeekRanges,
                firstRunDate,
              });

              return (
                <Link
                  key={iso}
                  href={`/plan/${iso}`}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs ${
                    today ? "border-zinc-100" : "border-zinc-800"
                  } ${inMonth ? "bg-zinc-900" : "bg-zinc-950 opacity-40"}`}
                >
                  <span className="tabular-nums text-zinc-200">{format(day, "d")}</span>
                  {status === "workout" && workout && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${RUN_TYPE_COLOR[workout.run_type]}`}
                    />
                  )}
                  {status === "rest" && (
                    <span className="text-[9px] text-zinc-600">rest</span>
                  )}
                  {status === "no_plan" && (
                    <span className="text-[9px] text-zinc-700">no plan</span>
                  )}
                  {status === "before_history" && (
                    <span className="text-[9px] text-zinc-800">n/a</span>
                  )}
                  {dayRuns.length > 0 && (
                    <span className="text-[9px] leading-none text-emerald-400">✓</span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 text-[10px] text-zinc-500">
        {(Object.keys(RUN_TYPE_COLOR) as RunType[]).map((t) => (
          <span key={t} className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${RUN_TYPE_COLOR[t]}`} />
            {t}
          </span>
        ))}
        <span className="flex items-center gap-1 text-emerald-400">
          ✓ <span className="text-zinc-500">logged</span>
        </span>
        <span>rest = designed rest day</span>
        <span>no plan = week not generated yet</span>
        <span>n/a = before your first logged run</span>
      </div>
    </div>
  );
}
