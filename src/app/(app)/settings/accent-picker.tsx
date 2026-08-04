"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAccentColor } from "./actions";
import { ACCENT_COLORS, type AccentColorKey } from "@/lib/accent-colors";

export default function AccentPicker({
  initialAccent,
}: {
  initialAccent: AccentColorKey;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(initialAccent);
  const [isPending, startTransition] = useTransition();

  function handlePick(key: string) {
    setSelected(key);
    startTransition(async () => {
      await updateAccentColor(key);
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Profile color
      </h2>
      <p className="mt-1 text-xs text-zinc-600">
        Make this page yours — only visible here, on your own profile.
      </p>
      <div className="mt-3 flex gap-3">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => handlePick(c.key)}
            disabled={isPending}
            aria-label={c.label}
            className={`h-9 w-9 rounded-full ${c.dot} ${
              selected === c.key
                ? `ring-2 ring-offset-2 ring-offset-zinc-900 ${c.ring}`
                : ""
            }`}
          />
        ))}
      </div>
    </section>
  );
}
