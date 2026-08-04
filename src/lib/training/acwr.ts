import type { RunType } from "@/lib/types";

const INTENSITY_FACTOR: Record<RunType, number> = {
  easy: 1.0,
  long: 1.0,
  recovery: 1.0,
  tempo: 1.3,
  interval: 1.5,
  race: 1.8,
};

export function runLoad(distanceMi: number, runType: RunType): number {
  return distanceMi * INTENSITY_FACTOR[runType];
}

export interface DailyLoad {
  date: string;
  load: number;
}

/**
 * ACWR = (last 7 days load) / (avg weekly load over last 28 days).
 * `dailyLoads` must cover the trailing 28 days, most recent last.
 */
export function acwr(dailyLoads: DailyLoad[]): number {
  const last28 = dailyLoads.slice(-28);
  if (last28.length === 0) return 0;
  const last7 = last28.slice(-7);
  const acuteLoad = last7.reduce((sum, d) => sum + d.load, 0);
  const chronicTotal = last28.reduce((sum, d) => sum + d.load, 0);
  const chronicWeeklyAvg = (chronicTotal / last28.length) * 7;
  if (chronicWeeklyAvg === 0) return 0;
  return acuteLoad / chronicWeeklyAvg;
}

export type AcwrZone = "detraining" | "sweet_spot" | "caution" | "hard_block";

export function classifyAcwr(ratio: number): AcwrZone {
  if (ratio < 0.8) return "detraining";
  if (ratio <= 1.3) return "sweet_spot";
  if (ratio <= 1.5) return "caution";
  return "hard_block";
}
