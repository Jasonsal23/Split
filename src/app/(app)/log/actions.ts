"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildSnapshotContext, persistSnapshot } from "@/lib/coach/snapshot-context";
import { createClient } from "@/lib/supabase/server";
import { getUserTimeZone } from "@/lib/timezone";

const logRunSchema = z.object({
  run_date: z.string().min(1),
  distance_mi: z.coerce.number().positive(),
  duration_sec: z.coerce.number().int().positive(),
  avg_hr: z.coerce.number().int().positive().optional().or(z.literal("")),
  rpe: z.coerce.number().int().min(1).max(10),
  run_type: z.enum(["easy", "long", "tempo", "interval", "recovery", "race"]),
  felt: z.enum(["great", "good", "ok", "rough", "bad"]),
  notes: z.string().optional(),
});

export async function logRun(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = logRunSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in" };
  }

  const { avg_hr, ...rest } = parsed.data;

  // If a workout was already planned for this date, link and complete it —
  // this is a plain DB update, not an AI call.
  const { data: matchedWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", user.id)
    .eq("scheduled_date", rest.run_date)
    .eq("status", "planned")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("runs").insert({
    ...rest,
    avg_hr: avg_hr === "" || avg_hr === undefined ? null : avg_hr,
    user_id: user.id,
    planned_workout_id: matchedWorkout ? (matchedWorkout.id as string) : null,
  });

  if (error) {
    return { error: error.message };
  }

  if (matchedWorkout) {
    await supabase
      .from("workouts")
      .update({ status: "completed" })
      .eq("id", matchedWorkout.id as string);
  }

  // Best-effort: refresh the fitness snapshot with pure math, no AI call.
  // A missing goal/baseline just means there's nothing to compute yet.
  const timeZone = await getUserTimeZone();
  const contextResult = await buildSnapshotContext(supabase, user.id, timeZone);
  if (contextResult.ok) {
    await persistSnapshot(supabase, user.id, contextResult.context.snapshot, timeZone);
  }

  revalidatePath("/log");
  revalidatePath("/today");
  revalidatePath("/plan");
  return { error: null };
}
