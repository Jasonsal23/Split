import { describe, expect, it } from "vitest";
import {
  clampLongRunMiles,
  clampTargetMiles,
  computeMaxSafeMiles,
  exceedsHardSessionLimit,
  hasBackToBackHardDays,
  hasThreeConsecutiveBadRuns,
} from "./safety";

describe("computeMaxSafeMiles", () => {
  it("caps a brand new runner at 15mi/wk", () => {
    expect(
      computeMaxSafeMiles({
        currentWeeklyMiles: 0,
        baselineWeeklyMiles: 0,
        weeksIntoBlock: 1,
        hadRoughHardRun: false,
      }),
    ).toBe(15);
  });

  it("allows 10% WoW growth off the current week", () => {
    // hand-checked: 15 * 1.10 = 16.5, past the first-4-week window
    expect(
      computeMaxSafeMiles({
        currentWeeklyMiles: 15,
        baselineWeeklyMiles: 10,
        weeksIntoBlock: 6,
        hadRoughHardRun: false,
      }),
    ).toBeCloseTo(16.5, 5);
  });

  it("drops to 5% growth after a rough/bad hard run", () => {
    // hand-checked: 15 * 1.05 = 15.75
    expect(
      computeMaxSafeMiles({
        currentWeeklyMiles: 15,
        baselineWeeklyMiles: 10,
        weeksIntoBlock: 6,
        hadRoughHardRun: true,
      }),
    ).toBeCloseTo(15.75, 5);
  });

  it("clamps to the baseline*1.10 ceiling during the first 4 weeks even after a spike", () => {
    // hand-checked: WoW cap = 20*1.1 = 22, but first-month ceiling = 10*1.1 = 11
    expect(
      computeMaxSafeMiles({
        currentWeeklyMiles: 20,
        baselineWeeklyMiles: 10,
        weeksIntoBlock: 2,
        hadRoughHardRun: false,
      }),
    ).toBeCloseTo(11, 5);
  });
});

describe("clampTargetMiles", () => {
  it("never returns more than the safe cap", () => {
    expect(clampTargetMiles(30, 22)).toBe(22);
    expect(clampTargetMiles(18, 22)).toBe(18);
  });
});

describe("clampLongRunMiles", () => {
  it("caps the long run at 35% of the weekly target", () => {
    // hand-checked: 20 * 0.35 = 7
    expect(clampLongRunMiles(10, 20)).toBeCloseTo(7, 5);
  });

  it("leaves a long run alone when it's already within the cap", () => {
    expect(clampLongRunMiles(5, 20)).toBe(5);
  });
});

describe("hasBackToBackHardDays", () => {
  it("flags two hard sessions on consecutive days", () => {
    expect(
      hasBackToBackHardDays([
        { scheduledDate: "2026-08-03", runType: "tempo" },
        { scheduledDate: "2026-08-04", runType: "interval" },
      ]),
    ).toBe(true);
  });

  it("allows hard sessions with a rest day between", () => {
    expect(
      hasBackToBackHardDays([
        { scheduledDate: "2026-08-03", runType: "tempo" },
        { scheduledDate: "2026-08-05", runType: "interval" },
      ]),
    ).toBe(false);
  });
});

describe("exceedsHardSessionLimit", () => {
  it("flags more than 2 hard sessions in a week", () => {
    expect(
      exceedsHardSessionLimit([
        { scheduledDate: "2026-08-03", runType: "tempo" },
        { scheduledDate: "2026-08-05", runType: "interval" },
        { scheduledDate: "2026-08-07", runType: "race" },
      ]),
    ).toBe(true);
  });
});

describe("hasThreeConsecutiveBadRuns", () => {
  it("flags exactly three trailing bad runs", () => {
    expect(hasThreeConsecutiveBadRuns(["good", "bad", "bad", "bad"])).toBe(true);
  });

  it("does not flag when the streak is broken", () => {
    expect(hasThreeConsecutiveBadRuns(["bad", "good", "bad"])).toBe(false);
  });
});
