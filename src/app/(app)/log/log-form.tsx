"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { logRun } from "./actions";
import { RUN_TYPES, FELT_OPTIONS } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { convertToMilesForStorage, type DistanceUnit } from "@/lib/units";
import { RPE_LABELS, FELT_EMOJI, durationToSeconds, inputClass } from "@/lib/run-form";
import { queueRun } from "@/lib/offline-queue";

const today = () => format(new Date(), "yyyy-MM-dd");

const CONFIRMATIONS = [
  "Hell yeah. Run logged.",
  "That's in the books.",
  "Nice work out there.",
  "Logged. Keep stacking days.",
  "Run's in. Well done.",
];

interface LoggedSummary {
  distanceDisplay: number;
  durationSec: number;
  runType: string;
  headline: string;
  offline?: boolean;
}

const AUTO_RESET_MS = 60_000;

export default function LogForm({
  initialDate,
  units,
}: {
  initialDate?: string;
  units: DistanceUnit;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState<LoggedSummary | null>(null);

  useEffect(() => {
    if (!logged) return;
    const id = setTimeout(() => setLogged(null), AUTO_RESET_MS);
    return () => clearTimeout(id);
  }, [logged]);

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

    const distanceDisplay = Number(formData.get("distance_mi"));
    const runType = String(formData.get("run_type"));

    formData.set("distance_mi", String(convertToMilesForStorage(distanceDisplay, units)));

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueRun(Object.fromEntries(formData.entries()) as Record<string, string>);
      form.reset();
      setLogged({
        distanceDisplay,
        durationSec,
        runType,
        headline: "Saved offline — will sync when you're back online.",
        offline: true,
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await logRun(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        form.reset();
        setLogged({
          distanceDisplay,
          durationSec,
          runType,
          headline: CONFIRMATIONS[Math.floor(Math.random() * CONFIRMATIONS.length)],
        });
      } catch {
        // Fetch failed mid-submit — most likely the connection dropped.
        // Queue it locally rather than losing the entry.
        queueRun(Object.fromEntries(formData.entries()) as Record<string, string>);
        form.reset();
        setLogged({
          distanceDisplay,
          durationSec,
          runType,
          headline: "Saved offline — will sync when you're back online.",
          offline: true,
        });
      }
    });
  }

  if (logged) {
    // distanceDisplay/durationSec are already in the athlete's chosen unit,
    // so the pace here needs no further mi<->km conversion — just formatting.
    const paceSecPerUnit = logged.durationSec / logged.distanceDisplay;
    const paceLabel = `${Math.floor(paceSecPerUnit / 60)}:${Math.round(paceSecPerUnit % 60)
      .toString()
      .padStart(2, "0")}/${units}`;

    return (
      <div
        className={`rounded-lg border p-6 text-center ${
          logged.offline
            ? "border-amber-900 bg-amber-950/30"
            : "border-emerald-900 bg-emerald-950/30"
        }`}
      >
        <p
          className={`text-xl font-semibold ${
            logged.offline ? "text-amber-300" : "text-emerald-300"
          }`}
        >
          {logged.headline}
        </p>
        <p className="mt-2 text-sm capitalize text-zinc-300">
          {logged.runType} · {logged.distanceDisplay} {units} in{" "}
          {formatDuration(logged.durationSec)} · {paceLabel}
        </p>
        <button
          type="button"
          onClick={() => setLogged(null)}
          className="mt-5 min-h-[44px] w-full rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950"
        >
          Log another run
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Date
          <input
            type="date"
            name="run_date"
            defaultValue={initialDate ?? today()}
            required
            className="min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Type
          <select
            name="run_type"
            defaultValue="easy"
            className="min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100"
          >
            {RUN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Distance ({units})
        <input
          type="number"
          step="0.01"
          min="0.01"
          name="distance_mi"
          required
          placeholder={units === "km" ? "10" : "6.2"}
          className={inputClass}
        />
      </label>

      <div>
        <p className="text-sm text-zinc-400">Duration (h : m : s)</p>
        <div className="mt-1 grid grid-cols-3 gap-3">
          <input
            type="number"
            min="0"
            name="duration_hh"
            placeholder="h"
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            max="59"
            name="duration_mm"
            placeholder="m"
            className={inputClass}
          />
          <input
            type="number"
            min="0"
            max="59"
            name="duration_ss"
            placeholder="s"
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
          placeholder="148"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-400">
        Perceived effort (RPE)
        <select
          name="rpe"
          required
          defaultValue=""
          className="min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100"
        >
          <option value="" disabled>
            Select...
          </option>
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
          defaultValue="good"
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
          className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-100"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[44px] w-full rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950 disabled:opacity-50"
      >
        {isPending ? "Logging..." : "Log your run"}
      </button>
    </form>
  );
}
