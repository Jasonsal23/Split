import { createClient } from "@/lib/supabase/server";
import { formatDuration, formatPace } from "@/lib/format";
import { formatDistance } from "@/lib/units";
import type { Run } from "@/lib/types";
import LogForm from "./log-form";

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: runs }] = await Promise.all([
    supabase.from("profiles").select("units").eq("id", user!.id).single(),
    supabase
      .from("runs")
      .select("*")
      .order("run_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30)
      .returns<Run[]>(),
  ]);
  const units = profile?.units ?? "mi";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-zinc-100">Log a run</h1>

      <LogForm initialDate={date} units={units} />

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Recent runs
        </h2>
        {!runs || runs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No runs logged yet. Your first entry starts the trend.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {runs.map((run) => {
              const paceSecPerMi = run.duration_sec / run.distance_mi;
              return (
                <li key={run.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {run.run_date} · {run.run_type}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatDistance(run.distance_mi, units)} in{" "}
                      {formatDuration(run.duration_sec)} ·{" "}
                      {formatPace(paceSecPerMi, units)}
                      {run.avg_hr ? ` · ${run.avg_hr} bpm` : ""}
                    </p>
                  </div>
                  <span className="text-xs capitalize text-zinc-400">
                    {run.felt}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
