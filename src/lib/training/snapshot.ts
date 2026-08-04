import type { RunType } from "@/lib/types";
import { acwr as computeAcwr, runLoad } from "./acwr";
import { riegelPredict } from "./riegel";
import { vdotFromRace } from "./vdot";

export interface RaceEffort {
  distanceMi: number;
  timeSec: number;
}

/**
 * Best available input for race prediction, in priority order:
 * a recent race > a self-reported mile pace estimate.
 * (Longest hard effort in the last 60 days is added once run history exists.)
 */
export function bestRaceEffort(params: {
  recentRaceDistMi: number | null;
  recentRaceTimeSec: number | null;
  estMilePaceSec: number | null;
}): RaceEffort | null {
  if (params.recentRaceDistMi && params.recentRaceTimeSec) {
    return {
      distanceMi: params.recentRaceDistMi,
      timeSec: params.recentRaceTimeSec,
    };
  }
  if (params.estMilePaceSec) {
    return { distanceMi: 1, timeSec: params.estMilePaceSec };
  }
  return null;
}

export interface RunForLoad {
  runDate: string;
  distanceMi: number;
  runType: RunType;
}

export interface SnapshotInput {
  bestEffort: RaceEffort;
  goalDistanceMi: number;
  goalTimeSec: number | null;
  weeklyMiles: number;
  recentRuns: RunForLoad[];
}

export interface FitnessSnapshotResult {
  vdot: number;
  predictedRaceSec: number;
  weeklyMiles: number;
  acwr: number;
  onTrack: boolean;
  gapSec: number;
}

export const ON_TRACK_GAP_THRESHOLD_SEC = 900;

export function computeFitnessSnapshot(
  input: SnapshotInput,
): FitnessSnapshotResult {
  const vdot = vdotFromRace(
    input.bestEffort.distanceMi,
    input.bestEffort.timeSec,
  );
  const predictedRaceSec = riegelPredict(
    input.bestEffort.distanceMi,
    input.bestEffort.timeSec,
    input.goalDistanceMi,
  );

  // With no logged runs yet, treat baseline weekly miles as steady-state load.
  const acwrValue =
    input.recentRuns.length > 0
      ? computeAcwr(
          input.recentRuns.map((r) => ({
            date: r.runDate,
            load: runLoad(r.distanceMi, r.runType),
          })),
        )
      : 1.0;

  const gapSec =
    input.goalTimeSec === null ? 0 : predictedRaceSec - input.goalTimeSec;
  const onTrack = gapSec <= ON_TRACK_GAP_THRESHOLD_SEC;

  return {
    vdot,
    predictedRaceSec,
    weeklyMiles: input.weeklyMiles,
    acwr: acwrValue,
    onTrack,
    gapSec,
  };
}

/** Easy runs can't demonstrate a new fitness ceiling the way a hard effort
 * can, so a noisy EF trend is capped rather than trusted outright. */
const MAX_EF_ADJUSTMENT_PCT = 8;

/**
 * Nudges a snapshot's predicted time using the easy-run efficiency trend,
 * so logging *any* run moves the number — scaled to what it actually
 * demonstrated, not treated as a fresh time trial. `efTrendPct` is the
 * signed % change in EF (positive = more efficient = faster).
 */
export function applyEfficiencyAdjustment(
  base: FitnessSnapshotResult,
  efTrendPct: number,
): FitnessSnapshotResult {
  const clampedPct = Math.max(
    -MAX_EF_ADJUSTMENT_PCT,
    Math.min(MAX_EF_ADJUSTMENT_PCT, efTrendPct),
  );
  const factor = 1 - clampedPct / 100;

  const predictedRaceSec = base.predictedRaceSec * factor;
  const vdot = base.vdot * (1 + clampedPct / 100);
  const gapSec = base.gapSec + (predictedRaceSec - base.predictedRaceSec);
  const onTrack = gapSec <= ON_TRACK_GAP_THRESHOLD_SEC;

  return {
    ...base,
    vdot,
    predictedRaceSec,
    gapSec,
    onTrack,
  };
}
