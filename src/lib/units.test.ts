import { describe, expect, it } from "vitest";
import {
  convertMilesForDisplay,
  convertToMilesForStorage,
  formatDistance,
  kmToMiles,
  milesToKm,
  paceSecPerMileForUnit,
} from "./units";

describe("milesToKm / kmToMiles", () => {
  it("converts 6.2mi to km", () => {
    // hand-checked: 6.2 * 1.609344 = 9.9779328
    expect(milesToKm(6.2)).toBeCloseTo(9.9779328, 5);
  });

  it("converts 10km to miles", () => {
    // hand-checked: 10 / 1.609344 = 6.21371
    expect(kmToMiles(10)).toBeCloseTo(6.21371, 4);
  });

  it("round-trips within floating point tolerance", () => {
    expect(kmToMiles(milesToKm(13.1))).toBeCloseTo(13.1, 6);
  });
});

describe("convertMilesForDisplay / convertToMilesForStorage", () => {
  it("passes miles through unchanged", () => {
    expect(convertMilesForDisplay(6.2, "mi")).toBe(6.2);
    expect(convertToMilesForStorage(6.2, "mi")).toBe(6.2);
  });

  it("converts for km display and back for storage", () => {
    expect(convertMilesForDisplay(6.2, "km")).toBeCloseTo(9.9779328, 5);
    expect(convertToMilesForStorage(9.9779328, "km")).toBeCloseTo(6.2, 5);
  });
});

describe("formatDistance", () => {
  it("formats miles with the mi suffix", () => {
    expect(formatDistance(6.2, "mi")).toBe("6.2 mi");
  });

  it("formats km with the km suffix, rounded to 2 decimals", () => {
    expect(formatDistance(6.2, "km")).toBe("9.98 km");
  });
});

describe("paceSecPerMileForUnit", () => {
  it("leaves mile pace unchanged", () => {
    expect(paceSecPerMileForUnit(600, "mi")).toBe(600);
  });

  it("converts mile pace to km pace", () => {
    // hand-checked: 600 / 1.609344 = 372.823
    expect(paceSecPerMileForUnit(600, "km")).toBeCloseTo(372.823, 2);
  });
});
