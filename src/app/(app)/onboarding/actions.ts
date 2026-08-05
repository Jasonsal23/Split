"use server";

import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  bestRaceEffort,
  computeFitnessSnapshot,
  type RunForLoad,
} from "@/lib/training/snapshot";
import { getUserTimeZone } from "@/lib/timezone";
import type { RunType } from "@/lib/types";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.coerce.number().optional(),
);

const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().optional(),
);

const onboardingSchema = z.object({
  race_name: z.string().min(1),
  race_date: z.string().min(1),
  race_distance_mi: z.coerce.number().positive(),
  goal_type: z.enum(["finish", "time"]),
  goal_time_sec: optionalNumber,

  weekly_miles: z.coerce.number().min(0),
  longest_recent_run: z.coerce.number().min(0),
  recent_race_dist: optionalNumber,
  recent_race_time_s: optionalNumber,
  est_mile_pace_sec: optionalNumber,
  injury_notes: optionalString,

  preferred_days: z.array(z.string()).min(1, "Select at least one day"),

  birth_year: optionalNumber,
  resting_hr: optionalNumber,
  max_hr: optionalNumber,

  accepted_disclaimer: z.literal("on"),
});

export async function completeOnboarding(formData: FormData) {
  const raw = {
    ...Object.fromEntries(formData.entries()),
    preferred_days: formData.getAll("preferred_days"),
  };
  const parsed = onboardingSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in" };
  }

  const { error: baselineError } = await supabase.from("baselines").insert({
    user_id: user.id,
    weekly_miles: data.weekly_miles,
    longest_recent_run: data.longest_recent_run,
    days_per_week: data.preferred_days.length,
    preferred_days: data.preferred_days,
    est_mile_pace_sec: data.est_mile_pace_sec ?? null,
    recent_race_dist: data.recent_race_dist ?? null,
    recent_race_time_s: data.recent_race_time_s ?? null,
    injury_notes: data.injury_notes ?? null,
  });
  if (baselineError) return { error: baselineError.message };

  const { error: goalError } = await supabase.from("goals").insert({
    user_id: user.id,
    race_name: data.race_name,
    race_date: data.race_date,
    race_distance_mi: data.race_distance_mi,
    goal_time_sec: data.goal_type === "time" ? data.goal_time_sec : null,
    goal_type: data.goal_type,
    is_active: true,
  });
  if (goalError) return { error: goalError.message };

  // Best-effort: contribute this race to the shared catalog so other
  // athletes running the same event can find it via search later.
  await supabase
    .from("race_catalog")
    .upsert(
      {
        race_name: data.race_name,
        race_date: data.race_date,
        race_distance_mi: data.race_distance_mi,
        created_by: user.id,
      },
      { onConflict: "race_name,race_date", ignoreDuplicates: true },
    );

  const nowIso = new Date().toISOString();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      birth_year: data.birth_year ?? null,
      resting_hr: data.resting_hr ?? null,
      max_hr: data.max_hr ?? null,
      onboarded_at: nowIso,
      accepted_disclaimer_at: nowIso,
    })
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  const effort = bestRaceEffort({
    recentRaceDistMi: data.recent_race_dist ?? null,
    recentRaceTimeSec: data.recent_race_time_s ?? null,
    estMilePaceSec: data.est_mile_pace_sec ?? null,
  });

  if (effort) {
    const timeZone = await getUserTimeZone();
    const since = subDays(toZonedTime(new Date(), timeZone), 28);

    const { data: recentRuns } = await supabase
      .from("runs")
      .select("run_date, distance_mi, run_type")
      .gte("run_date", format(since, "yyyy-MM-dd"));

    const runsForLoad: RunForLoad[] = (recentRuns ?? []).map((r) => ({
      runDate: r.run_date as string,
      distanceMi: r.distance_mi as number,
      runType: r.run_type as RunType,
    }));

    const snapshot = computeFitnessSnapshot({
      bestEffort: effort,
      goalDistanceMi: data.race_distance_mi,
      goalTimeSec: data.goal_type === "time" ? (data.goal_time_sec ?? null) : null,
      weeklyMiles: data.weekly_miles,
      recentRuns: runsForLoad,
    });

    const { error: snapshotError } = await supabase
      .from("fitness_snapshots")
      .insert({
        user_id: user.id,
        snapshot_date: format(toZonedTime(new Date(), timeZone), "yyyy-MM-dd"),
        vdot: snapshot.vdot,
        predicted_race_sec: Math.round(snapshot.predictedRaceSec),
        weekly_miles: snapshot.weeklyMiles,
        acwr: snapshot.acwr,
        on_track: snapshot.onTrack,
        gap_sec: Math.round(snapshot.gapSec),
      });
    if (snapshotError) return { error: snapshotError.message };
  }

  redirect("/today");
}
