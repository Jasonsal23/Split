import Anthropic from "@anthropic-ai/sdk";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { COACH_MODEL, COACH_SYSTEM_PROMPT, type CoachPayload } from "@/lib/coach/prompt";
import { coachResponseSchema, type CoachResponse } from "@/lib/coach/schema";
import { buildSnapshotContext, persistSnapshot } from "@/lib/coach/snapshot-context";
import { determinePhase, weeksToRace } from "@/lib/training/periodization";
import {
  clampLongRunMiles,
  clampTargetMiles,
  computeMaxSafeMiles,
  hasThreeConsecutiveBadRuns,
  isHardRunType,
} from "@/lib/training/safety";
import { trainingPaces } from "@/lib/training/vdot";
import { createClient } from "@/lib/supabase/server";
import { getUserTimeZone } from "@/lib/timezone";
import { DAYS_OF_WEEK } from "@/lib/types";

const CONTEXT_ERROR_MESSAGES = {
  no_goal: "Set a goal before generating a plan.",
  no_baseline: "Complete onboarding before generating a plan.",
  no_effort: "Not enough data yet — log a recent race time or mile pace estimate.",
} as const;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const timeZone = await getUserTimeZone();
  const contextResult = await buildSnapshotContext(supabase, user.id, timeZone);
  if (!contextResult.ok) {
    return NextResponse.json(
      { error: CONTEXT_ERROR_MESSAGES[contextResult.reason] },
      { status: 400 },
    );
  }
  const { goal, upcomingGoals, baseline, runs, currentWeeklyMiles, snapshot, efTrendPct } =
    contextResult.context;

  const today = toZonedTime(new Date(), timeZone);
  const weekStartDate = startOfWeek(today, { weekStartsOn: 1 });
  const weekStart = format(weekStartDate, "yyyy-MM-dd");

  const raceDate = parseISO(goal.race_date);
  const weeksRemaining = weeksToRace(today, raceDate);
  const blockStart = new Date(goal.created_at);
  const totalBlockWeeks = Math.max(1, weeksToRace(blockStart, raceDate));
  const weeksIntoBlock = Math.max(1, totalBlockWeeks - weeksRemaining + 1);
  const isMarathon = goal.race_distance_mi >= 26;
  const phase = determinePhase(totalBlockWeeks, weeksRemaining, isMarathon);

  const last7 = runs.filter(
    (r) => differenceInCalendarDays(today, parseISO(r.run_date)) < 7,
  );
  const hadRoughHardRun = last7.some(
    (r) => r.rpe >= 8 && (r.felt === "rough" || r.felt === "bad"),
  );

  const maxSafeMiles = computeMaxSafeMiles({
    currentWeeklyMiles,
    baselineWeeklyMiles: baseline.weekly_miles,
    weeksIntoBlock,
    hadRoughHardRun,
  });

  const mustHoldVolume = hasThreeConsecutiveBadRuns(
    runs.slice(-3).map((r) => r.felt),
  );

  const last4WeeksMiles: number[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
    const weekEnd = startOfWeek(subWeeks(today, i - 1), { weekStartsOn: 1 });
    const total = runs
      .filter((r) => {
        const d = parseISO(r.run_date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((s, r) => s + r.distance_mi, 0);
    last4WeeksMiles.push(Math.round(total * 10) / 10);
  }

  const payload: CoachPayload = {
    today: format(today, "yyyy-MM-dd"),
    week_start: weekStart,
    weeks_to_race: weeksRemaining,
    phase,
    goal: {
      distance_mi: goal.race_distance_mi,
      goal_time_sec: goal.goal_type === "time" ? goal.goal_time_sec : null,
    },
    upcoming_goals: upcomingGoals.map((g) => ({
      race_name: g.race_name,
      race_date: g.race_date,
      distance_mi: g.race_distance_mi,
    })),
    fitness: {
      vdot: Math.round(snapshot.vdot * 10) / 10,
      predicted_race_sec: Math.round(snapshot.predictedRaceSec),
      gap_sec: Math.round(snapshot.gapSec),
      ef_trend_pct: Math.round(efTrendPct * 10) / 10,
      acwr: Math.round(snapshot.acwr * 100) / 100,
    },
    last_4_weeks_miles: last4WeeksMiles,
    recent_runs: runs.slice(-10).map((r) => ({
      date: r.run_date,
      mi: r.distance_mi,
      pace_s: Math.round(r.duration_sec / r.distance_mi),
      hr: r.avg_hr,
      rpe: r.rpe,
      felt: r.felt,
      notes: r.notes,
    })),
    constraints: {
      days_per_week: baseline.days_per_week,
      preferred_days: baseline.preferred_days ?? [...DAYS_OF_WEEK],
      max_safe_miles: Math.round(maxSafeMiles * 10) / 10,
      injury_notes: baseline.injury_notes ?? "",
    },
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: COACH_MODEL,
    max_tokens: 4096,
    system: COACH_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(payload) }],
  });

  if (message.stop_reason === "max_tokens") {
    return NextResponse.json(
      { error: "Coach response was cut off (hit the token limit). Try again." },
      { status: 502 },
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "Coach response had no text content." },
      { status: 502 },
    );
  }

  const jsonText = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { error: "Coach response was not valid JSON.", raw: textBlock.text },
      { status: 502 },
    );
  }

  const parsed = coachResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Coach response failed validation.", details: parsed.error.issues },
      { status: 502 },
    );
  }
  const coach: CoachResponse = parsed.data;

  // Belt-and-suspenders: the model is told the real week, but if it still
  // returns dates from the wrong week, re-anchor by weekday offset rather
  // than trusting its absolute date.
  const remappedWorkouts = coach.week.workouts.map((w) => {
    const original = parseISO(w.scheduled_date);
    const originalWeekStart = startOfWeek(original, { weekStartsOn: 1 });
    const offsetDays = differenceInCalendarDays(original, originalWeekStart);
    return {
      ...w,
      scheduled_date: format(addDays(weekStartDate, offsetDays), "yyyy-MM-dd"),
    };
  });

  let clampedTargetMiles = clampTargetMiles(coach.week.target_miles, maxSafeMiles);
  if (clampedTargetMiles < coach.week.target_miles) {
    console.warn(
      `Clamped coach target_miles from ${coach.week.target_miles} to ${clampedTargetMiles} (max_safe_miles=${maxSafeMiles}) for user ${user.id}`,
    );
  }

  const extraWarnings: string[] = [];
  if (mustHoldVolume) {
    const volumeCeiling = currentWeeklyMiles > 0 ? currentWeeklyMiles : baseline.weekly_miles;
    if (clampedTargetMiles > volumeCeiling) {
      clampedTargetMiles = volumeCeiling;
      extraWarnings.push(
        "Your last three runs all felt rough or bad, so this week's mileage was held flat instead of increased — give your body a chance to catch up before adding more.",
      );
    }
  }

  const paces = trainingPaces(snapshot.vdot);
  const sortedWorkouts = [...remappedWorkouts].sort((a, b) =>
    a.scheduled_date.localeCompare(b.scheduled_date),
  );

  let hardCount = 0;
  let prevHardDate: Date | null = null;
  const clampedWorkouts = sortedWorkouts.map((w) => {
    if (!isHardRunType(w.run_type)) return w;

    const date = parseISO(w.scheduled_date);
    const adjacentToPrevHard =
      prevHardDate !== null && differenceInCalendarDays(date, prevHardDate) === 1;
    const overLimit = hardCount >= 2;

    if (adjacentToPrevHard || overLimit) {
      return {
        ...w,
        run_type: "easy" as const,
        target_pace_low_s: Math.round(paces.easy.fastSecPerMi),
        target_pace_high_s: Math.round(paces.easy.slowSecPerMi),
        description: `${w.description} (auto-adjusted to easy: too many/adjacent hard days this week)`,
      };
    }

    hardCount += 1;
    prevHardDate = date;
    return w;
  });

  // The long run never exceeds 35% of the week's total volume.
  const longRunDistance = Math.max(0, ...clampedWorkouts.map((w) => w.target_distance_mi));
  const longRunIndex = clampedWorkouts.findIndex(
    (w) => w.target_distance_mi === longRunDistance,
  );
  const longRunCapMiles = clampLongRunMiles(longRunDistance, clampedTargetMiles);
  const finalWorkouts = clampedWorkouts.map((w, i) => {
    if (i !== longRunIndex || w.target_distance_mi <= longRunCapMiles) return w;
    return {
      ...w,
      target_distance_mi: Math.round(longRunCapMiles * 10) / 10,
      description: `${w.description} (auto-adjusted: long run capped at 35% of weekly volume)`,
    };
  });

  // Regenerating mid-week replaces the existing week rather than duplicating it;
  // workouts cascade-delete with it.
  await supabase
    .from("plan_weeks")
    .delete()
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  const { data: planWeek, error: planWeekError } = await supabase
    .from("plan_weeks")
    .insert({
      user_id: user.id,
      week_start: weekStart,
      week_index: weeksIntoBlock,
      phase,
      target_miles: clampedTargetMiles,
      is_deload: coach.week.is_deload,
      generation_reason: coach.focus,
    })
    .select("id")
    .single();

  if (planWeekError || !planWeek) {
    return NextResponse.json(
      { error: planWeekError?.message ?? "Failed to save plan week." },
      { status: 500 },
    );
  }

  const { error: workoutsError } = await supabase.from("workouts").insert(
    finalWorkouts.map((w) => ({
      user_id: user.id,
      plan_week_id: planWeek.id as string,
      scheduled_date: w.scheduled_date,
      run_type: w.run_type,
      target_distance_mi: w.target_distance_mi,
      target_pace_low_s: w.target_pace_low_s,
      target_pace_high_s: w.target_pace_high_s,
      description: w.description,
      status: "planned",
    })),
  );
  if (workoutsError) {
    return NextResponse.json({ error: workoutsError.message }, { status: 500 });
  }

  const snapshotResult = await persistSnapshot(supabase, user.id, snapshot, timeZone);
  if ("error" in snapshotResult) {
    return NextResponse.json({ error: snapshotResult.error }, { status: 500 });
  }

  const messagesToInsert = [
    {
      user_id: user.id,
      snapshot_id: snapshotResult.id,
      role: "assessment",
      body: coach.assessment,
    },
    ...[...coach.warnings, ...extraWarnings].map((w) => ({
      user_id: user.id,
      snapshot_id: snapshotResult.id,
      role: "warning",
      body: w,
    })),
  ];
  const { error: messagesError } = await supabase
    .from("coach_messages")
    .insert(messagesToInsert);
  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  revalidatePath("/plan");
  revalidatePath("/today");
  revalidatePath("/coach");

  return NextResponse.json({ ok: true, planWeekId: planWeek.id });
}
