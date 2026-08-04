"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRun } from "../actions";
import { RUN_TYPES, FELT_OPTIONS, type Run } from "@/lib/types";
import { formatDuration, formatPace } from "@/lib/format";
import { convertMilesForDisplay, convertToMilesForStorage, formatDistance, type DistanceUnit } from "@/lib/units";
import {
  RPE_LABELS,
  FELT_EMOJI,
  durationToSeconds,
  secondsToHms,
  inputClass,
} from "@/lib/run-form";

export default function RunEntry({ run, units }: { run: Run; units: DistanceUnit }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const form = formRef.current;
    if (!form) return;

    const durationSec = durationToSeconds(form);
    if (durationSec <= 0) {
      setError("Enter a duration.");
      return;
    }
    formData.set("duration_sec", String(durationSec));

    const enteredDistance = Number(formData.get("distance_mi"));
    formData.set("distance_mi", String(convertToMilesForStorage(enteredDistance, units)));

    formData.set("run_id", run.id);

    startTransition(async () => {
      const result = await updateRun(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMode("view");
        router.refresh();
      }
    });
  }

  if (mode === "view") {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium capitalize text-zinc-100">
            {run.run_type} · {formatDistance(run.distance_mi, units)} in{" "}
            {formatDuration(run.duration_sec)}
          </p>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="text-xs font-medium text-zinc-400 underline"
          >
            Edit
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {formatPace(run.duration_sec / run.distance_mi, units)}
          {run.avg_hr ? ` · ${run.avg_hr} bpm` : ""} · {FELT_EMOJI[run.felt]} felt {run.felt}
        </p>
        {run.notes && <p className="mt-2 text-sm text-zinc-300">{run.notes}</p>}
      </div>
    );
  }

  const duration = secondsToHms(run.duration_sec);

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Type
          <select
            name="run_type"
            defaultValue={run.run_type}
            className="min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100"
          >
            {RUN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Distance ({units})
          <input
            type="number"
            step="0.01"
            min="0.01"
            name="distance_mi"
            required
            defaultValue={Math.round(convertMilesForDisplay(run.distance_mi, units) * 100) / 100}
            className={inputClass}
          />
        </label>
      </div>

      <div>
        <p className="text-sm text-zinc-400">Duration (h : m : s)</p>
        <div className="mt-1 grid grid-cols-3 gap-3">
          <input
            type="number"
            min="0"
            name="duration_hh"
            defaultValue={duration.h}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            max="59"
            name="duration_mm"
            defaultValue={duration.m}
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            max="59"
            name="duration_ss"
            defaultValue={duration.s}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Avg HR (optional)
        <input
          type="number"
          min="1"
          name="avg_hr"
          defaultValue={run.avg_hr ?? ""}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Perceived effort (RPE)
        <select
          name="rpe"
          required
          defaultValue={run.rpe}
          className="min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100"
        >
          {Object.entries(RPE_LABELS).map(([n, label]) => (
            <option key={n} value={n}>
              {n} — {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Felt
        <select
          name="felt"
          defaultValue={run.felt}
          className="min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100"
        >
          {FELT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {FELT_EMOJI[f]} {f}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Notes (optional)
        <textarea
          name="notes"
          rows={2}
          defaultValue={run.notes ?? ""}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
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
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
