"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { updatePersonalInfo } from "./actions";
import { inputClass } from "@/lib/run-form";

export interface PersonalInfoInitial {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  email: string;
}

export default function PersonalInfoSection({
  initial,
  accentBorderClass,
}: {
  initial: PersonalInfoInitial;
  accentBorderClass?: string;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePersonalInfo(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setMode("view");
      }
    });
  }

  const fullName = [initial.first_name, initial.last_name].filter(Boolean).join(" ");

  return (
    <section
      className={`rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 p-4 ${
        accentBorderClass ?? "border-l-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Personal info
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
        <div className="mt-3 space-y-1">
          <p className="text-base text-zinc-100">{fullName || "—"}</p>
          <p className="text-sm text-zinc-400">{initial.email}</p>
          <p className="text-sm text-zinc-400">
            {initial.date_of_birth
              ? format(parseISO(initial.date_of_birth), "MMMM d, yyyy")
              : "Date of birth not set"}
          </p>
        </div>
      ) : (
        <form action={handleSubmit} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="first_name"
              defaultValue={initial.first_name}
              placeholder="First name"
              required
              className={inputClass}
            />
            <input
              name="last_name"
              defaultValue={initial.last_name}
              placeholder="Last name"
              required
              className={inputClass}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Email
            <input
              value={initial.email}
              disabled
              className={`${inputClass} opacity-50`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-400">
            Date of birth
            <input
              type="date"
              name="date_of_birth"
              defaultValue={initial.date_of_birth ?? ""}
              className={inputClass}
            />
          </label>

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
    </section>
  );
}
