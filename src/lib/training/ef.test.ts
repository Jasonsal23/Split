import { describe, expect, it } from "vitest";
import { efficiencyFactor, efTrendPct, rollingEf } from "./ef";

describe("efficiencyFactor", () => {
  it("computes EF for a 6.2mi run in 53:00 at 148bpm", () => {
    // hand-checked: (6.2 * 1609.34) / 3180 / 148 = 0.021201
    expect(efficiencyFactor(6.2, 3180, 148)).toBeCloseTo(0.021201, 5);
  });
});

describe("rollingEf", () => {
  it("averages EF across samples", () => {
    const avg = rollingEf([
      { distanceMi: 6.2, durationSec: 3180, avgHr: 148 },
      { distanceMi: 6.2, durationSec: 3180, avgHr: 148 },
    ]);
    expect(avg).toBeCloseTo(0.021201, 5);
  });

  it("returns 0 for an empty set", () => {
    expect(rollingEf([])).toBe(0);
  });
});

describe("efTrendPct", () => {
  it("reports positive percent change when EF improves", () => {
    expect(efTrendPct(0.02, 0.0205)).toBeCloseTo(2.5, 5);
  });
});
