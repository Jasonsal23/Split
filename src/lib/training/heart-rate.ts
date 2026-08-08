import type { RunType } from "@/lib/types";

/** 208 - 0.7*age, the standard fallback when no measured max HR is on file. */
export function estimateAge(
  birthYear: number | null,
  dateOfBirthIso: string | null,
  today: Date,
): number | null {
  if (dateOfBirthIso) {
    const dob = new Date(`${dateOfBirthIso}T00:00:00`);
    let age = today.getFullYear() - dob.getFullYear();
    const hadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hadBirthdayThisYear) age -= 1;
    return age;
  }
  if (birthYear) return today.getFullYear() - birthYear;
  return null;
}

export function estimateMaxHr(
  providedMaxHr: number | null,
  birthYear: number | null,
  dateOfBirthIso: string | null,
  today: Date,
): number | null {
  if (providedMaxHr) return providedMaxHr;
  const age = estimateAge(birthYear, dateOfBirthIso, today);
  if (age === null) return null;
  return Math.round(208 - 0.7 * age);
}

export interface HrZone {
  lowBpm: number;
  highBpm: number;
}

export type HrZoneKey = "easy" | "marathon" | "threshold" | "interval";

/** Percent of heart-rate reserve (Karvonen method), roughly aligned with the
 * %VO2max training-pace bands in vdot.ts, but HR and pace zones aren't a 1:1
 * mapping — these are the standard ranges coaches use for HR specifically. */
const HRR_BANDS: Record<HrZoneKey, [number, number]> = {
  easy: [0.65, 0.78],
  marathon: [0.8, 0.85],
  threshold: [0.85, 0.9],
  interval: [0.9, 0.97],
};

const RUN_TYPE_TO_ZONE: Record<RunType, HrZoneKey | null> = {
  easy: "easy",
  long: "easy",
  recovery: "easy",
  tempo: "threshold",
  interval: "interval",
  race: "marathon",
};

export type HrZones = Record<HrZoneKey, HrZone>;

/** Null when there's no usable resting/max HR — never invent a zone from nothing. */
export function heartRateZones(
  restingHr: number | null,
  maxHr: number | null,
): HrZones | null {
  if (!restingHr || !maxHr || maxHr <= restingHr) return null;
  const reserve = maxHr - restingHr;

  const zone = ([lowPct, highPct]: [number, number]): HrZone => ({
    lowBpm: Math.round(restingHr + reserve * lowPct),
    highBpm: Math.round(restingHr + reserve * highPct),
  });

  return {
    easy: zone(HRR_BANDS.easy),
    marathon: zone(HRR_BANDS.marathon),
    threshold: zone(HRR_BANDS.threshold),
    interval: zone(HRR_BANDS.interval),
  };
}

export function hrZoneForRunType(runType: RunType, zones: HrZones | null): HrZone | null {
  if (!zones) return null;
  const key = RUN_TYPE_TO_ZONE[runType];
  return key ? zones[key] : null;
}

/**
 * Sanity-clamp an AI-proposed HR target against what's physiologically
 * plausible for this athlete. Returns null (rather than a guessed range) if
 * there's nothing reliable to clamp against — code is the safety net, not
 * the model, same as every other prescribed number in this app.
 */
export function clampHrTarget(
  proposedLowBpm: number | null,
  proposedHighBpm: number | null,
  restingHr: number | null,
  maxHr: number | null,
): HrZone | null {
  if (proposedLowBpm === null || proposedHighBpm === null) return null;
  if (!restingHr || !maxHr || maxHr <= restingHr) return null;

  const low = Math.min(proposedLowBpm, proposedHighBpm);
  const high = Math.max(proposedLowBpm, proposedHighBpm);

  return {
    lowBpm: Math.min(Math.max(Math.round(low), restingHr), maxHr),
    highBpm: Math.min(Math.max(Math.round(high), restingHr), maxHr),
  };
}
