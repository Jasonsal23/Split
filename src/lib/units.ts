export type DistanceUnit = "mi" | "km";

export const KM_PER_MILE = 1.609344;

export function milesToKm(mi: number): number {
  return mi * KM_PER_MILE;
}

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

/** Convert a stored miles value into the athlete's preferred display unit. */
export function convertMilesForDisplay(mi: number, unit: DistanceUnit): number {
  return unit === "km" ? milesToKm(mi) : mi;
}

/** Convert a value the athlete entered in their preferred unit back to miles for storage. */
export function convertToMilesForStorage(value: number, unit: DistanceUnit): number {
  return unit === "km" ? kmToMiles(value) : value;
}

export function formatDistance(mi: number, unit: DistanceUnit): string {
  const value = convertMilesForDisplay(mi, unit);
  return `${Math.round(value * 100) / 100} ${unit}`;
}

/** Pace stored as seconds-per-mile, converted to seconds-per-{unit}. */
export function paceSecPerMileForUnit(secPerMi: number, unit: DistanceUnit): number {
  return unit === "km" ? secPerMi / KM_PER_MILE : secPerMi;
}
