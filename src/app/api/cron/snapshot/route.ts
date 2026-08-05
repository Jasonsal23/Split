import { NextRequest, NextResponse } from "next/server";
import { buildSnapshotContext, persistSnapshot } from "@/lib/coach/snapshot-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Weekly checkpoint: computes a fresh fitness_snapshots row for every athlete
 * with an active goal, regardless of whether they logged a run this week.
 * Keeps /progress on a regular cadence instead of only updating when a run
 * happens to be logged. Triggered by Vercel Cron — see vercel.json.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("user_id")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((goals ?? []).map((g) => g.user_id as string))];

  let succeeded = 0;
  const skipped: string[] = [];

  for (const userId of userIds) {
    // Cron has no per-request browser cookie to read a timezone from (unlike
    // every other caller of these two functions), and there's no per-user
    // timezone stored in the DB yet — falls back to a fixed default. Only
    // affects this weekly checkpoint's snapshot_date by at most a day right
    // at the boundary; the daily-visible /today, /plan, and plan-generation
    // paths are all timezone-correct per request.
    const contextResult = await buildSnapshotContext(supabase, userId, DEFAULT_TIMEZONE);
    if (!contextResult.ok) {
      skipped.push(`${userId}:${contextResult.reason}`);
      continue;
    }
    const result = await persistSnapshot(
      supabase,
      userId,
      contextResult.context.snapshot,
      DEFAULT_TIMEZONE,
    );
    if ("error" in result) {
      skipped.push(`${userId}:${result.error}`);
    } else {
      succeeded++;
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), succeeded, skipped });
}
