import { describe, expect, it } from "vitest";
import { acwr, classifyAcwr, runLoad, type DailyLoad } from "./acwr";

describe("runLoad", () => {
  it("weights load by intensity factor", () => {
    expect(runLoad(6, "easy")).toBeCloseTo(6.0, 6);
    expect(runLoad(6, "tempo")).toBeCloseTo(7.8, 6);
    expect(runLoad(6, "interval")).toBeCloseTo(9.0, 6);
    expect(runLoad(6, "race")).toBeCloseTo(10.8, 6);
  });
});

describe("acwr", () => {
  it("computes ratio for a spike week after a steady base", () => {
    const days: DailyLoad[] = [
      ...Array.from({ length: 21 }, (_, i) => ({ date: `base-${i}`, load: 5 })),
      ...Array.from({ length: 7 }, (_, i) => ({ date: `spike-${i}`, load: 8 })),
    ];
    // hand-checked: acute=56, chronic weekly avg = (161/28)*7 = 40.25, ratio = 1.3913
    expect(acwr(days)).toBeCloseTo(1.3913, 3);
  });

  it("returns 0 when there is no chronic load", () => {
    expect(acwr([])).toBe(0);
  });
});

describe("classifyAcwr", () => {
  it("buckets ratios into training zones", () => {
    expect(classifyAcwr(0.6)).toBe("detraining");
    expect(classifyAcwr(1.0)).toBe("sweet_spot");
    expect(classifyAcwr(1.4)).toBe("caution");
    expect(classifyAcwr(1.6)).toBe("hard_block");
  });
});
