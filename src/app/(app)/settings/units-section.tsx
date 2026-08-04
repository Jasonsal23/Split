"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUnits } from "./actions";
import type { DistanceUnit } from "@/lib/units";

export default function UnitsSection({
  initialUnits,
  accentBorderClass,
}: {
  initialUnits: DistanceUnit;
  accentBorderClass?: string;
}) {
  const router = useRouter();
  const [units, setUnits] = useState<DistanceUnit>(initialUnits);
  const [isPending, startTransition] = useTransition();

  function handlePick(value: DistanceUnit) {
    setUnits(value);
    startTransition(async () => {
      await updateUnits(value);
      router.refresh();
    });
  }

  return (
    <section
      className={`rounded-lg border border-zinc-800 border-l-4 bg-zinc-900 p-4 ${
        accentBorderClass ?? "border-l-zinc-800"
      }`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Units
      </h2>
      <p className="mt-1 text-xs text-zinc-600">
        Changes distance and pace everywhere in the app.
      </p>
      <div className="mt-3 flex rounded-md border border-zinc-800 p-0.5 text-sm">
        <button
          type="button"
          onClick={() => handlePick("mi")}
          disabled={isPending}
          className={`flex-1 rounded px-3 py-2 font-medium ${
            units === "mi" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400"
          }`}
        >
          Miles
        </button>
        <button
          type="button"
          onClick={() => handlePick("km")}
          disabled={isPending}
          className={`flex-1 rounded px-3 py-2 font-medium ${
            units === "km" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400"
          }`}
        >
          Kilometers
        </button>
      </div>
    </section>
  );
}
