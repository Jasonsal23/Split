"use client";

import { useState, useTransition } from "react";
import { updatePreferredDays } from "./actions";
import { DAYS_OF_WEEK, DAY_LABELS, type DayOfWeek } from "@/lib/types";

export default function PreferencesSection({
  initialPreferredDays,
  accentBorderClass,
}: {
  initialPreferredDays: DayOfWeek[];
  accentBorderClass?: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePreferredDays(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMode("view");
      }
    });
  }

  const summary =
    initialPreferredDays.length === 7
      ? "Every day"
      : initialPreferredDays.map((d) => DAY_LABELS[d]).join(", ");

  return (
    <section
      className={`rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 p-4 ${
        accentBorderClass ?? "border-l-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Running availability
        </h2>
        {mode === "view" && (
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="text-xs font-medium text-zinc-400 underline"
          >
            Edit
          </button>
        )}
      </div>

      {mode === "view" ? (
        <p className="mt-3 text-sm text-zinc-400">
          {summary || "No days selected"}
        </p>
      ) : (
        <form action={handleSubmit} className="mt-3 space-y-3">
          <p className="text-sm text-zinc-400">
            Which days could you run on? Update this any time your schedule
            changes — the coach still decides how many of these you actually
            should run.
          </p>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => (
              <label
                key={day}
                className="flex min-h-[44px] items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200"
              >
                <input
                  type="checkbox"
                  name="preferred_days"
                  value={day}
                  defaultChecked={initialPreferredDays.includes(day)}
                />
                {DAY_LABELS[day]}
              </label>
            ))}
          </div>

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
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
