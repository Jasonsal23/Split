import { formatDuration } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import { DAY_LABELS } from "@/lib/types";
import { TOUR_GOAL, TOUR_PROFILE, TOUR_UPCOMING_GOAL } from "@/app/tour/fake-data";

export default function SettingsPreview() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 border-l-4 border-l-zinc-300 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Primary goal
        </h2>
        <div className="mt-3 space-y-1">
          <p className="text-base text-zinc-100">{TOUR_GOAL.raceName}</p>
          <p className="text-sm text-zinc-400">
            {TOUR_GOAL.raceDate} · {formatDistance(TOUR_GOAL.distanceMi, "mi")}
          </p>
          <p className="text-sm text-zinc-400">
            Goal: {formatDuration(TOUR_GOAL.goalTimeSec)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 border-l-4 border-l-zinc-300 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Later goal
        </h2>
        <div className="mt-3 space-y-1">
          <p className="text-base text-zinc-100">{TOUR_UPCOMING_GOAL.raceName}</p>
          <p className="text-sm text-zinc-400">
            {TOUR_UPCOMING_GOAL.raceDate} ·{" "}
            {formatDistance(TOUR_UPCOMING_GOAL.distanceMi, "mi")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Preferred days
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOUR_PROFILE.preferredDays.map((day) => (
            <span
              key={day}
              className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200"
            >
              {DAY_LABELS[day]}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Units
        </h2>
        <p className="mt-3 text-sm text-zinc-300">Miles</p>
      </div>
    </div>
  );
}
