// A small curated palette for the athlete's own Profile page only — kept
// separate from the app's status colors (emerald = on-track, amber = warning)
// so a personal choice never gets mistaken for a status signal.
export const ACCENT_COLORS = [
  { key: "zinc", label: "Default", dot: "bg-zinc-100", ring: "ring-zinc-300", border: "border-l-zinc-300", text: "text-zinc-200" },
  { key: "blue", label: "Blue", dot: "bg-blue-500", ring: "ring-blue-500", border: "border-l-blue-500", text: "text-blue-400" },
  { key: "violet", label: "Violet", dot: "bg-violet-500", ring: "ring-violet-500", border: "border-l-violet-500", text: "text-violet-400" },
  { key: "rose", label: "Rose", dot: "bg-rose-500", ring: "ring-rose-500", border: "border-l-rose-500", text: "text-rose-400" },
  { key: "cyan", label: "Cyan", dot: "bg-cyan-500", ring: "ring-cyan-500", border: "border-l-cyan-500", text: "text-cyan-400" },
  { key: "fuchsia", label: "Fuchsia", dot: "bg-fuchsia-500", ring: "ring-fuchsia-500", border: "border-l-fuchsia-500", text: "text-fuchsia-400" },
] as const;

export type AccentColorKey = (typeof ACCENT_COLORS)[number]["key"];

export function getAccent(key: string | null | undefined) {
  return ACCENT_COLORS.find((c) => c.key === key) ?? ACCENT_COLORS[0];
}
