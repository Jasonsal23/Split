const METERS_PER_MILE = 1609.34;

/** Efficiency factor: (distance_meters / duration_sec) / avg_hr. Higher is fitter. */
export function efficiencyFactor(
  distanceMi: number,
  durationSec: number,
  avgHr: number,
): number {
  const distanceM = distanceMi * METERS_PER_MILE;
  return distanceM / durationSec / avgHr;
}

export interface EfSample {
  distanceMi: number;
  durationSec: number;
  avgHr: number;
}

/** Average EF over a set of runs, used for the 4-week rolling trend. */
export function rollingEf(samples: EfSample[]): number {
  if (samples.length === 0) return 0;
  const total = samples.reduce(
    (sum, s) => sum + efficiencyFactor(s.distanceMi, s.durationSec, s.avgHr),
    0,
  );
  return total / samples.length;
}

/** % change from an earlier EF baseline to a later one. Positive = improving. */
export function efTrendPct(earlierEf: number, laterEf: number): number {
  if (earlierEf === 0) return 0;
  return ((laterEf - earlierEf) / earlierEf) * 100;
}
