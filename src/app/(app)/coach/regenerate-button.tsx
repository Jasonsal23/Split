"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RegenerateButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/coach/generate", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(body.details)
          ? body.details
              .map((d: { path: (string | number)[]; message: string }) =>
                `${d.path.join(".")}: ${d.message}`,
              )
              .join("; ")
          : null;
        setError(
          [body.error ?? "Failed to generate a plan.", detail].filter(Boolean).join(" — "),
        );
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="min-h-[44px] w-full rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950 disabled:opacity-50"
      >
        {isPending ? "Generating..." : "Generate this week's plan"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
