export function raceTypeLabel(distanceMi: number): string {
  if (Math.abs(distanceMi - 3.1) < 0.15) return "5K";
  if (Math.abs(distanceMi - 6.2) < 0.2) return "10K";
  if (Math.abs(distanceMi - 13.1) < 0.3) return "Half Marathon";
  if (Math.abs(distanceMi - 26.2) < 0.3) return "Marathon";
  if (distanceMi > 26.2) return "Ultra";
  return `${distanceMi} mi`;
}
