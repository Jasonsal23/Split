import type { Felt } from "@/lib/types";

export const inputClass =
  "min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base tabular-nums text-zinc-100 placeholder:text-zinc-600";

export const RPE_LABELS: Record<number, string> = {
  1: "Very easy",
  2: "Very easy",
  3: "Easy",
  4: "Comfortable",
  5: "Comfortable",
  6: "Moderate",
  7: "Moderately hard",
  8: "Hard",
  9: "Very hard",
  10: "All-out",
};

export const FELT_EMOJI: Record<Felt, string> = {
  great: "🤩",
  good: "🙂",
  ok: "😐",
  rough: "😕",
  bad: "😣",
};

export function durationToSeconds(form: HTMLFormElement, prefix = "duration"): number {
  const h = Number(
    (form.elements.namedItem(`${prefix}_hh`) as HTMLInputElement | null)?.value || 0,
  );
  const m = Number(
    (form.elements.namedItem(`${prefix}_mm`) as HTMLInputElement | null)?.value || 0,
  );
  const s = Number(
    (form.elements.namedItem(`${prefix}_ss`) as HTMLInputElement | null)?.value || 0,
  );
  return h * 3600 + m * 60 + s;
}

export function secondsToHms(totalSec: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  return { h: String(h), m: String(m), s: String(s) };
}
