export type Phase = "base" | "build" | "peak" | "taper" | "race";

export function weeksToRace(today: Date, raceDate: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((raceDate.getTime() - today.getTime()) / msPerWeek));
}

/**
 * Base 40% -> Build 35% -> Peak 15% -> Taper 10% of the block, taper floored
 * to a minimum length (3 weeks for a marathon, 2 otherwise).
 */
export function determinePhase(
  totalBlockWeeks: number,
  weeksRemaining: number,
  isMarathon: boolean,
): Phase {
  if (weeksRemaining <= 0) return "race";

  const taperWeeks = Math.max(isMarathon ? 3 : 2, Math.round(totalBlockWeeks * 0.1));
  const peakWeeks = Math.round(totalBlockWeeks * 0.15);
  const buildWeeks = Math.round(totalBlockWeeks * 0.35);
  const baseWeeks = Math.max(0, totalBlockWeeks - buildWeeks - peakWeeks - taperWeeks);

  const weeksElapsed = totalBlockWeeks - weeksRemaining;

  if (weeksElapsed < baseWeeks) return "base";
  if (weeksElapsed < baseWeeks + buildWeeks) return "build";
  if (weeksElapsed < baseWeeks + buildWeeks + peakWeeks) return "peak";
  return "taper";
}

/** Every 4th week of the block is a deload at ~70% volume. */
export function isDeloadWeek(weekIndex: number): boolean {
  return weekIndex > 0 && weekIndex % 4 === 0;
}

/** Longest long run allowed: 20-22mi, and only once inside 3 weeks of race day. */
export function maxLongRunMi(weeksRemaining: number): number {
  return weeksRemaining <= 3 ? 22 : 20;
}
