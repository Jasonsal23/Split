"use client";

import { useRef, useState, useTransition } from "react";
import { addGoal } from "./actions";
import { inputClass } from "@/lib/run-form";
import { convertMilesForDisplay, convertToMilesForStorage, type DistanceUnit } from "@/lib/units";
import RaceSearch from "@/components/race-search";
import type { RaceCatalogEntry } from "@/lib/types";

function timeFieldsToSeconds(form: HTMLFormElement): number | null {
  const h = Number(
    (form.elements.namedItem("goal_time_hh") as HTMLInputElement | null)?.value || 0,
  );
  const m = Number(
    (form.elements.namedItem("goal_time_mm") as HTMLInputElement | null)?.value || 0,
  );
  const s = Number(
    (form.elements.namedItem("goal_time_ss") as HTMLInputElement | null)?.value || 0,
  );
  const total = h * 3600 + m * 60 + s;
  return total > 0 ? total : null;
}

export default function AddGoalForm({ units }: { units: DistanceUnit }) {
  const formRef = useRef<HTMLFormElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const distanceRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [goalType, setGoalType] = useState<"finish" | "time">("time");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCatalogSelect(entry: RaceCatalogEntry) {
    setRaceName(entry.race_name);
    if (dateRef.current) dateRef.current.value = entry.race_date;
    if (distanceRef.current) {
      distanceRef.current.value = String(
        Math.round(convertMilesForDisplay(entry.race_distance_mi, units) * 100) / 100,
      );
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    const form = formRef.current;
    if (!form) return;

    const goalTimeSec = timeFieldsToSeconds(form);
    if (goalTimeSec !== null) formData.set("goal_time_sec", String(goalTimeSec));

    const enteredDistance = Number(formData.get("race_distance_mi"));
    formData.set(
      "race_distance_mi",
      String(convertToMilesForStorage(enteredDistance, units)),
    );

    startTransition(async () => {
      const result = await addGoal(formData);
      if (result.error) {
        setError(result.error);
      } else {
        form.reset();
        setRaceName("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] w-full rounded-lg border border-dashed border-zinc-700 text-sm font-medium text-zinc-400"
      >
        + Add another race
      </button>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        New race
      </h2>
      <form ref={formRef} action={handleSubmit} className="mt-3 space-y-3">
        <RaceSearch value={raceName} onChange={setRaceName} onSelect={handleCatalogSelect} />
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Race date
          <input ref={dateRef} type="date" name="race_date" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Distance ({units})
          <input
            ref={distanceRef}
            type="number"
            step="0.1"
            min="0.1"
            name="race_distance_mi"
            required
            className={inputClass}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm text-zinc-400">Goal</legend>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name="goal_type"
              value="time"
              checked={goalType === "time"}
              onChange={() => setGoalType("time")}
            />
            Target time
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name="goal_type"
              value="finish"
              checked={goalType === "finish"}
              onChange={() => setGoalType("finish")}
            />
            Just finish
          </label>
        </fieldset>

        {goalType === "time" && (
          <div>
            <p className="text-sm text-zinc-400">Target time (h : m : s)</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <input name="goal_time_hh" type="number" min="0" className={inputClass} />
              <input
                name="goal_time_mm"
                type="number"
                min="0"
                max="59"
                className={inputClass}
              />
              <input
                name="goal_time_ss"
                type="number"
                min="0"
                max="59"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRaceName("");
              setOpen(false);
            }}
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] flex-1 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add race"}
          </button>
        </div>
      </form>
    </section>
  );
}
