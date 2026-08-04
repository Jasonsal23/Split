/** Riegel race time prediction: T2 = T1 * (D2/D1)^1.06 */
export function riegelPredict(
  knownDistanceMi: number,
  knownTimeSec: number,
  targetDistanceMi: number,
): number {
  return knownTimeSec * Math.pow(targetDistanceMi / knownDistanceMi, 1.06);
}
