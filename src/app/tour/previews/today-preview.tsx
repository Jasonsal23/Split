import { formatDuration, formatPace } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import {
  TOUR_GOAL,
  TOUR_SNAPSHOT,
  TOUR_TODAY_WORKOUT,
} from "@/app/tour/fake-data";

export default function TodayPreview() {
  const units = "mi" as const;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold text-zinc-100">Good morning, Alex</p>
        <p className="mt-1 text-sm text-zinc-400">
          {TOUR_GOAL.raceName} · {TOUR_GOAL.raceDate} ·{" "}
          <span className="font-medium text-zinc-200">68 days to go</span>
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          This week
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">
          {formatDistance(TOUR_SNAPSHOT.weeklyMiles, units)}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Current fitness
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">
          {formatDuration(TOUR_SNAPSHOT.predictedRaceSec)}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          predicted at {formatDistance(TOUR_GOAL.distanceMi, units)}, VDOT{" "}
          {TOUR_SNAPSHOT.vdot.toFixed(1)}
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          Goal is {formatDuration(TOUR_GOAL.goalTimeSec)} —{" "}
          <span className="text-amber-400">
            {formatDuration(TOUR_SNAPSHOT.gapSec)} behind
          </span>
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Today&apos;s workout
        </p>
        <p className="mt-2 text-lg font-semibold capitalize text-zinc-100">
          {TOUR_TODAY_WORKOUT.runType} ·{" "}
          {formatDistance(TOUR_TODAY_WORKOUT.targetDistanceMi, units)}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          {formatPace(TOUR_TODAY_WORKOUT.targetPaceLowSec, units)}–
          {formatPace(TOUR_TODAY_WORKOUT.targetPaceHighSec, units)}
        </p>
        <p className="mt-2 text-sm text-zinc-300">{TOUR_TODAY_WORKOUT.description}</p>
      </div>

      <div className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950">
        Log your run
      </div>
    </div>
  );
}
