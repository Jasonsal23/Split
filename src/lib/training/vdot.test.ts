import { describe, expect, it } from "vitest";
import { trainingPaces, vdotFromRace } from "./vdot";

describe("vdotFromRace", () => {
  it("derives VDOT from a 20:00 5K", () => {
    // hand-checked via the Daniels-Gilbert VO2/%VO2max formulas
    const distanceMi = 5000 / 1609.34;
    expect(vdotFromRace(distanceMi, 1200)).toBeCloseTo(49.81, 1);
  });
});

describe("trainingPaces", () => {
  it("derives an easy pace range from VDOT", () => {
    const paces = trainingPaces(49.806233428066335);
    expect(paces.easy.fastSecPerMi).toBeCloseTo(473.87, 1);
    expect(paces.easy.slowSecPerMi).toBeCloseTo(568.06, 1);
  });

  it("orders every zone fast <= slow and gets faster as intensity rises", () => {
    const paces = trainingPaces(45);
    for (const range of Object.values(paces)) {
      expect(range.fastSecPerMi).toBeLessThanOrEqual(range.slowSecPerMi);
    }
    expect(paces.repetition.fastSecPerMi).toBeLessThan(
      paces.easy.fastSecPerMi,
    );
  });
});
