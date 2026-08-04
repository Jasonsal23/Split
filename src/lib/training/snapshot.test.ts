import { describe, expect, it } from "vitest";
import {
  applyEfficiencyAdjustment,
  bestRaceEffort,
  computeFitnessSnapshot,
  type FitnessSnapshotResult,
} from "./snapshot";

describe("bestRaceEffort", () => {
  it("prefers a recent race over a pace estimate", () => {
    const effort = bestRaceEffort({
      recentRaceDistMi: 6.21371,
      recentRaceTimeSec: 3000,
      estMilePaceSec: 500,
    });
    expect(effort).toEqual({ distanceMi: 6.21371, timeSec: 3000 });
  });

  it("falls back to the mile pace estimate", () => {
    const effort = bestRaceEffort({
      recentRaceDistMi: null,
      recentRaceTimeSec: null,
      estMilePaceSec: 500,
    });
    expect(effort).toEqual({ distanceMi: 1, timeSec: 500 });
  });

  it("returns null with no usable input", () => {
    expect(
      bestRaceEffort({
        recentRaceDistMi: null,
        recentRaceTimeSec: null,
        estMilePaceSec: null,
      }),
    ).toBeNull();
  });
});

describe("computeFitnessSnapshot", () => {
  it("derives vdot, predicted time, and gap from a 10K effort against a marathon goal", () => {
    // hand-checked via vdotFromRace/riegelPredict for a 50:00 10K -> marathon goal of 4:00:00
    const result = computeFitnessSnapshot({
      bestEffort: { distanceMi: 6.21371, timeSec: 3000 },
      goalDistanceMi: 26.2,
      goalTimeSec: 14400,
      weeklyMiles: 25,
      recentRuns: [],
    });

    expect(result.vdot).toBeCloseTo(40.01, 1);
    expect(result.predictedRaceSec).toBeCloseTo(13790, 0);
    expect(result.gapSec).toBeCloseTo(-609.9, 0);
    expect(result.onTrack).toBe(true);
    expect(result.acwr).toBe(1.0);
    expect(result.weeklyMiles).toBe(25);
  });

  it("flags off-track when the gap exceeds 900 seconds", () => {
    const result = computeFitnessSnapshot({
      bestEffort: { distanceMi: 6.21371, timeSec: 3000 },
      goalDistanceMi: 26.2,
      goalTimeSec: 12600,
      weeklyMiles: 25,
      recentRuns: [],
    });
    expect(result.gapSec).toBeGreaterThan(900);
    expect(result.onTrack).toBe(false);
  });

  it("computes ACWR from recent runs instead of the 1.0 default when present", () => {
    const result = computeFitnessSnapshot({
      bestEffort: { distanceMi: 6.21371, timeSec: 3000 },
      goalDistanceMi: 26.2,
      goalTimeSec: null,
      weeklyMiles: 25,
      recentRuns: [
        { runDate: "2026-07-01", distanceMi: 6, runType: "easy" },
        { runDate: "2026-07-28", distanceMi: 6, runType: "easy" },
      ],
    });
    expect(result.acwr).not.toBe(1.0);
    expect(result.gapSec).toBe(0);
  });
});

describe("applyEfficiencyAdjustment", () => {
  const base: FitnessSnapshotResult = {
    vdot: 40.01191146263214,
    predictedRaceSec: 13790.137111098382,
    weeklyMiles: 25,
    acwr: 1.0,
    onTrack: true,
    gapSec: -609.8628889016181,
  };

  it("speeds up the prediction for a positive EF trend", () => {
    // hand-checked: factor = 0.95, predictedSec = 13790.137... * 0.95
    const result = applyEfficiencyAdjustment(base, 5);
    expect(result.predictedRaceSec).toBeCloseTo(13100.63, 1);
    expect(result.vdot).toBeCloseTo(42.0125, 3);
    expect(result.gapSec).toBeCloseTo(-1299.37, 1);
    expect(result.onTrack).toBe(true);
  });

  it("slows down the prediction for a negative EF trend", () => {
    const result = applyEfficiencyAdjustment(base, -3);
    expect(result.predictedRaceSec).toBeCloseTo(14203.84, 1);
    expect(result.vdot).toBeCloseTo(38.8116, 3);
  });

  it("clamps an extreme EF trend to the max adjustment", () => {
    // 20% is clamped to the 8% cap before being applied
    const clamped = applyEfficiencyAdjustment(base, 20);
    const atCap = applyEfficiencyAdjustment(base, 8);
    expect(clamped.predictedRaceSec).toBeCloseTo(atCap.predictedRaceSec, 6);
  });

  it("leaves the other fields untouched", () => {
    const result = applyEfficiencyAdjustment(base, 5);
    expect(result.weeklyMiles).toBe(base.weeklyMiles);
    expect(result.acwr).toBe(base.acwr);
  });
});
