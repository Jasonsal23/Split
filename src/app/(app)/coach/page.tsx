import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { CoachMessage, PlanWeek } from "@/lib/types";
import RegenerateButton from "./regenerate-button";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user!.id)
    .single();

  if (!profile?.onboarded_at) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-zinc-100">Coach</h1>
        <p className="text-sm text-zinc-400">
          Set up your goal and baseline first — the coach needs something to
          reason about.
        </p>
      </div>
    );
  }

  const [{ data: messages }, { data: latestPlanWeek }] = await Promise.all([
    supabase
      .from("coach_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<CoachMessage[]>(),
    supabase
      .from("plan_weeks")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .returns<PlanWeek[]>()
      .maybeSingle(),
  ]);

  const latestAssessment = messages?.find((m) => m.role === "assessment");
  const history = messages?.filter((m) => m.id !== latestAssessment?.id) ?? [];

  const nextRecommended = latestPlanWeek
    ? addDays(new Date(latestPlanWeek.week_start), 7)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Coach</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Generates a fresh weekly plan from your logged runs. Rerun it any
          time, or after a new week starts.
        </p>
      </div>

      <RegenerateButton />

      {latestPlanWeek && (
        <p className="text-xs text-zinc-500">
          Last generated{" "}
          {new Date(latestPlanWeek.generated_at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {nextRecommended && (
            <>
              {" "}
              · next recommended on{" "}
              {nextRecommended.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </>
          )}
        </p>
      )}

      {latestAssessment ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Latest assessment
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {latestAssessment.body}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No assessments yet — generate this week&apos;s plan to get one.
        </p>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            History
          </h2>
          <ul className="mt-3 space-y-3">
            {history.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg border p-3 text-sm ${
                  m.role === "warning"
                    ? "border-zinc-800 border-l-4 border-l-amber-500 bg-zinc-900 text-zinc-200"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    m.role === "warning" ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {m.role === "warning" ? "Coach flag" : m.role} ·{" "}
                  {new Date(m.created_at).toLocaleDateString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-zinc-600">
        Split generates training suggestions using AI and your logged data.
        It is not a certified coach or medical provider.
      </p>
    </div>
  );
}
