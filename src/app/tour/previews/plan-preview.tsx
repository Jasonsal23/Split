import type { RunType } from "@/lib/types";
import { formatDistance } from "@/lib/units";
import { TOUR_PLAN_WEEK, TOUR_WEEK_WORKOUTS } from "@/app/tour/fake-data";

const RUN_TYPE_COLOR: Record<RunType, string> = {
  easy: "bg-zinc-500",
  long: "bg-blue-500",
  tempo: "bg-amber-500",
  interval: "bg-orange-500",
  recovery: "bg-zinc-600",
  race: "bg-purple-500",
};

export default function PlanPreview() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs text-zinc-400">
          This week: <span className="capitalize">{TOUR_PLAN_WEEK.phase}</span> ·{" "}
          {formatDistance(TOUR_PLAN_WEEK.targetMiles, "mi")}
        </p>
      </div>

      <div className="space-y-2">
        {TOUR_WEEK_WORKOUTS.map((w) => (
          <div
            key={w.day}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <p className="text-sm font-semibold text-zinc-100">{w.day}</p>
            {w.distanceMi !== null ? (
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${RUN_TYPE_COLOR[w.runType]}`} />
                <p className="text-sm capitalize text-zinc-300">
                  {w.runType} · {formatDistance(w.distanceMi, "mi")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Rest day</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
