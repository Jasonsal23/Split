import { describe, expect, it } from "vitest";
import {
  clampHrTarget,
  estimateAge,
  estimateMaxHr,
  heartRateZones,
  hrZoneForRunType,
} from "./heart-rate";

describe("estimateAge", () => {
  it("computes age from date of birth when the birthday already passed this year", () => {
    expect(estimateAge(null, "1990-06-15", new Date(2026, 7, 8))).toBe(36);
  });

  it("computes age from date of birth when the birthday hasn't happened yet this year", () => {
    expect(estimateAge(null, "1990-09-27", new Date(2026, 7, 8))).toBe(35);
  });

  it("falls back to a plain birth-year subtraction", () => {
    expect(estimateAge(1990, null, new Date(2026, 7, 8))).toBe(36);
  });

  it("returns null with no birth info at all", () => {
    expect(estimateAge(null, null, new Date(2026, 7, 8))).toBeNull();
  });
});

describe("estimateMaxHr", () => {
  it("prefers a provided max HR over any estimate", () => {
    expect(estimateMaxHr(190, 1990, null, new Date(2026, 7, 8))).toBe(190);
  });

  it("falls back to 208 - 0.7*age", () => {
    // age 36 -> 208 - 25.2 = 182.8 -> 183
    expect(estimateMaxHr(null, 1990, null, new Date(2026, 7, 8))).toBe(183);
  });

  it("returns null with nothing to estimate from", () => {
    expect(estimateMaxHr(null, null, null, new Date(2026, 7, 8))).toBeNull();
  });
});

describe("heartRateZones", () => {
  it("derives Karvonen zones from resting/max HR", () => {
    // reserve = 190 - 60 = 130
    const zones = heartRateZones(60, 190);
    expect(zones).toEqual({
      easy: { lowBpm: 145, highBpm: 161 },
      marathon: { lowBpm: 164, highBpm: 171 },
      threshold: { lowBpm: 171, highBpm: 177 },
      interval: { lowBpm: 177, highBpm: 186 },
    });
  });

  it("returns null when resting or max HR is missing", () => {
    expect(heartRateZones(null, 190)).toBeNull();
    expect(heartRateZones(60, null)).toBeNull();
  });

  it("returns null when max HR isn't actually above resting HR", () => {
    expect(heartRateZones(100, 90)).toBeNull();
  });
});

describe("hrZoneForRunType", () => {
  const zones = heartRateZones(60, 190)!;

  it("maps easy/long/recovery to the easy zone", () => {
    expect(hrZoneForRunType("easy", zones)).toEqual(zones.easy);
    expect(hrZoneForRunType("long", zones)).toEqual(zones.easy);
    expect(hrZoneForRunType("recovery", zones)).toEqual(zones.easy);
  });

  it("maps tempo to threshold and interval to interval", () => {
    expect(hrZoneForRunType("tempo", zones)).toEqual(zones.threshold);
    expect(hrZoneForRunType("interval", zones)).toEqual(zones.interval);
  });

  it("returns null when there are no zones to map into", () => {
    expect(hrZoneForRunType("easy", null)).toBeNull();
  });
});

describe("clampHrTarget", () => {
  it("passes through a sane proposal unchanged", () => {
    expect(clampHrTarget(140, 160, 60, 190)).toEqual({ lowBpm: 140, highBpm: 160 });
  });

  it("normalizes a swapped low/high", () => {
    expect(clampHrTarget(160, 140, 60, 190)).toEqual({ lowBpm: 140, highBpm: 160 });
  });

  it("clamps below resting HR up to resting HR", () => {
    expect(clampHrTarget(30, 160, 60, 190)).toEqual({ lowBpm: 60, highBpm: 160 });
  });

  it("clamps above max HR down to max HR", () => {
    expect(clampHrTarget(140, 250, 60, 190)).toEqual({ lowBpm: 140, highBpm: 190 });
  });

  it("returns null when the proposal itself is null", () => {
    expect(clampHrTarget(null, 160, 60, 190)).toBeNull();
  });

  it("returns null when there's no resting/max HR to clamp against", () => {
    expect(clampHrTarget(140, 160, null, 190)).toBeNull();
  });
});
