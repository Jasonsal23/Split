"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildSnapshotContext, persistSnapshot } from "@/lib/coach/snapshot-context";
import { createClient } from "@/lib/supabase/server";

const updateRunSchema = z.object({
  run_id: z.string().min(1),
  distance_mi: z.coerce.number().positive(),
  duration_sec: z.coerce.number().int().positive(),
  avg_hr: z.coerce.number().int().positive().optional().or(z.literal("")),
  rpe: z.coerce.number().int().min(1).max(10),
  run_type: z.enum(["easy", "long", "tempo", "interval", "recovery", "race"]),
  felt: z.enum(["great", "good", "ok", "rough", "bad"]),
  notes: z.string().optional(),
});

export async function updateRun(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = updateRunSchema.safeParse(raw);

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

  const { run_id, avg_hr, notes, ...rest } = parsed.data;

  const { data: run, error } = await supabase
    .from("runs")
    .update({
      ...rest,
      avg_hr: avg_hr === "" || avg_hr === undefined ? null : avg_hr,
      notes: notes || null,
    })
    .eq("id", run_id)
    .eq("user_id", user.id)
    .select("run_date")
    .single();

  if (error || !run) {
    return { error: error?.message ?? "Failed to update run." };
  }

  // The edited stats can change the fitness numbers — refresh for free, no AI call.
  const contextResult = await buildSnapshotContext(supabase, user.id);
  if (contextResult.ok) {
    await persistSnapshot(supabase, user.id, contextResult.context.snapshot);
  }

  revalidatePath("/plan");
  revalidatePath(`/plan/${run.run_date as string}`);
  revalidatePath("/today");

  return { error: null };
}
