import { describe, expect, it } from "vitest";
import { riegelPredict } from "./riegel";

describe("riegelPredict", () => {
  it("predicts a marathon from a 10K time", () => {
    // hand-checked: 40:00 10K -> marathon = 2400 * (26.2/6.2143...)^1.06
    const tenKMi = 6.21371;
    const predicted = riegelPredict(tenKMi, 2400, 26.2);
    expect(predicted).toBeCloseTo(11032, 0);
  });

  it("returns the known time when distances match", () => {
    expect(riegelPredict(10, 3600, 10)).toBeCloseTo(3600, 6);
  });
});
