"use server";

import { createClient } from "@/lib/supabase/server";
import type { RaceCatalogEntry } from "@/lib/types";

/** Shared, crowdsourced race lookup — used by both onboarding and the Settings "add race" flow. */
export async function searchRaceCatalog(query: string): Promise<RaceCatalogEntry[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("race_catalog")
    .select("*")
    .ilike("race_name", `%${trimmed}%`)
    .order("race_date", { ascending: true })
    .limit(8)
    .returns<RaceCatalogEntry[]>();

  return data ?? [];
}
