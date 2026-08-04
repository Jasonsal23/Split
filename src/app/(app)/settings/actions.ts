"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.coerce.number().optional(),
);

const optionalString = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().optional(),
);

const personalInfoSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: optionalString,
});

export async function updatePersonalInfo(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = personalInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      date_of_birth: parsed.data.date_of_birth ?? null,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

const raceInfoSchema = z.object({
  race_name: z.string().min(1),
  race_date: z.string().min(1),
  race_distance_mi: z.coerce.number().positive(),
  goal_type: z.enum(["finish", "time"]),
  goal_time_sec: optionalNumber,
});

function revalidateGoalPaths() {
  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/plan");
  revalidatePath("/progress");
  revalidatePath("/coach");
}

export async function addGoal(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = raceInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    race_name: data.race_name,
    race_date: data.race_date,
    race_distance_mi: data.race_distance_mi,
    goal_time_sec: data.goal_type === "time" ? (data.goal_time_sec ?? null) : null,
    goal_type: data.goal_type,
    is_active: true,
  });
  if (error) return { error: error.message };

  // Best-effort: contribute this race to the shared catalog so other
  // athletes running the same event can find it. Ignored if it already
  // exists (unique on race_name + race_date) or if this fails outright.
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

  revalidateGoalPaths();
  return { error: null };
}

export async function updateGoal(goalId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = raceInfoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("goals")
    .update({
      race_name: data.race_name,
      race_date: data.race_date,
      race_distance_mi: data.race_distance_mi,
      goal_time_sec: data.goal_type === "time" ? (data.goal_time_sec ?? null) : null,
      goal_type: data.goal_type,
    })
    .eq("id", goalId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidateGoalPaths();
  return { error: null };
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidateGoalPaths();
  return { error: null };
}

const preferredDaysSchema = z.object({
  preferred_days: z.array(z.string()).min(1, "Select at least one day"),
});

export async function updatePreferredDays(formData: FormData) {
  const raw = { preferred_days: formData.getAll("preferred_days") };
  const parsed = preferredDaysSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: baseline } = await supabase
    .from("baselines")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!baseline) return { error: "No baseline to update." };

  const { error } = await supabase
    .from("baselines")
    .update({
      preferred_days: parsed.data.preferred_days,
      days_per_week: parsed.data.preferred_days.length,
    })
    .eq("id", baseline.id as string)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateAccentColor(accentColor: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ accent_color: accentColor })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateUnits(units: "mi" | "km") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ units })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/plan");
  revalidatePath("/plan/[date]", "page");
  revalidatePath("/progress");
  revalidatePath("/log");
  return { error: null };
}
