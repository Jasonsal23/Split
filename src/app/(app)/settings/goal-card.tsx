"use client";

import { useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { updateGoal, deleteGoal } from "./actions";
import { inputClass } from "@/lib/run-form";
import { formatDuration } from "@/lib/format";
import {
  convertMilesForDisplay,
  convertToMilesForStorage,
  formatDistance,
  type DistanceUnit,
} from "@/lib/units";
import type { Goal } from "@/lib/types";

function secondsToHms(totalSec: number | null) {
  if (!totalSec) return { h: "", m: "", s: "" };
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h: h > 0 ? String(h) : "", m: String(m), s: String(s) };
}

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

export default function GoalCard({
  goal,
  isPrimary,
  accentBorderClass,
  units,
}: {
  goal: Goal;
  isPrimary: boolean;
  accentBorderClass?: string;
  units: DistanceUnit;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [goalType, setGoalType] = useState<"finish" | "time">(goal.goal_type);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      const result = await updateGoal(goal.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMode("view");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Remove ${goal.race_name}? This can't be undone.`)) return;
    startDeleteTransition(async () => {
      const result = await deleteGoal(goal.id);
      if (result.error) setError(result.error);
    });
  }

  const duration = secondsToHms(goal.goal_time_sec);

  return (
    <section
      className={`rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 p-4 ${
        accentBorderClass ?? "border-l-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {isPrimary ? "Primary goal" : "Later goal"}
        </h2>
        {mode === "view" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="text-xs font-medium text-zinc-400 underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs font-medium text-red-400 underline disabled:opacity-50"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </button>
          </div>
        )}
      </div>

      {mode === "view" ? (
        <div className="mt-3 space-y-1">
          <p className="text-base text-zinc-100">{goal.race_name}</p>
          <p className="text-sm text-zinc-400">
            {format(parseISO(goal.race_date), "MMMM d, yyyy")} ·{" "}
            {formatDistance(goal.race_distance_mi, units)}
          </p>
          <p className="text-sm text-zinc-400">
            {goal.goal_type === "time" && goal.goal_time_sec
              ? `Goal: ${formatDuration(goal.goal_time_sec)}`
              : "Goal: just finish"}
          </p>
          {!isPrimary && (
            <p className="text-xs text-zinc-500">
              Training currently focuses on your primary goal. The coach
              factors this race in when planning what comes after.
            </p>
          )}
        </div>
      ) : (
        <form ref={formRef} action={handleSubmit} className="mt-3 space-y-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Race name
            <input
              name="race_name"
              defaultValue={goal.race_name}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Race date
            <input
              type="date"
              name="race_date"
              defaultValue={goal.race_date}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Distance ({units})
            <input
              type="number"
              step="0.1"
              min="0.1"
              name="race_distance_mi"
              defaultValue={
                Math.round(convertMilesForDisplay(goal.race_distance_mi, units) * 100) / 100
              }
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
                <input
                  name="goal_time_hh"
                  type="number"
                  min="0"
                  defaultValue={duration.h}
                  className={inputClass}
                />
                <input
                  name="goal_time_mm"
                  type="number"
                  min="0"
                  max="59"
                  defaultValue={duration.m}
                  className={inputClass}
                />
                <input
                  name="goal_time_ss"
                  type="number"
                  min="0"
                  max="59"
                  defaultValue={duration.s}
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
                setMode("view");
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
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {mode === "view" && error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </section>
  );
}
