import { paceSecPerMileForUnit, type DistanceUnit } from "@/lib/units";

export function formatPace(secPerMi: number, unit: DistanceUnit = "mi"): string {
  const secPerUnit = paceSecPerMileForUnit(secPerMi, unit);
  const mins = Math.floor(secPerUnit / 60);
  const secs = Math.round(secPerUnit % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/${unit}`;
}

export function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.round(totalSec % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
