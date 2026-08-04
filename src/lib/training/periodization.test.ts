import { describe, expect, it } from "vitest";
import {
  determinePhase,
  isDeloadWeek,
  maxLongRunMi,
  weeksToRace,
} from "./periodization";

describe("weeksToRace", () => {
  it("rounds up to the nearest whole week", () => {
    const today = new Date("2026-08-01T00:00:00Z");
    const race = new Date("2026-08-15T00:00:00Z");
    expect(weeksToRace(today, race)).toBe(2);
  });

  it("clamps to 0 once race day has passed", () => {
    const today = new Date("2026-08-20T00:00:00Z");
    const race = new Date("2026-08-01T00:00:00Z");
    expect(weeksToRace(today, race)).toBe(0);
  });
});

describe("determinePhase", () => {
  // hand-checked for a 20-week marathon block: taper=3, peak=3, build=7, base=7
  it("walks base -> build -> peak -> taper -> race across a 20-week block", () => {
    expect(determinePhase(20, 20, true)).toBe("base");
    expect(determinePhase(20, 13, true)).toBe("build");
    expect(determinePhase(20, 6, true)).toBe("peak");
    expect(determinePhase(20, 2, true)).toBe("taper");
    expect(determinePhase(20, 0, true)).toBe("race");
  });
});

describe("isDeloadWeek", () => {
  it("flags every 4th week", () => {
    expect(isDeloadWeek(4)).toBe(true);
    expect(isDeloadWeek(8)).toBe(true);
    expect(isDeloadWeek(1)).toBe(false);
    expect(isDeloadWeek(0)).toBe(false);
  });
});

describe("maxLongRunMi", () => {
  it("allows 22mi only inside the final 3 weeks", () => {
    expect(maxLongRunMi(4)).toBe(20);
    expect(maxLongRunMi(3)).toBe(22);
    expect(maxLongRunMi(1)).toBe(22);
  });
});
