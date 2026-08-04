const METERS_PER_MILE = 1609.34;

function vo2ForVelocity(velocityMPerMin: number): number {
  return (
    -4.6 + 0.182258 * velocityMPerMin + 0.000104 * velocityMPerMin ** 2
  );
}

function velocityForVo2(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  return (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
}

function percentVo2Max(timeMin: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin)
  );
}

/** Daniels-Gilbert VDOT from a race performance. */
export function vdotFromRace(distanceMi: number, timeSec: number): number {
  const distanceM = distanceMi * METERS_PER_MILE;
  const timeMin = timeSec / 60;
  const velocity = distanceM / timeMin;
  const vo2 = vo2ForVelocity(velocity);
  const pct = percentVo2Max(timeMin);
  return vo2 / pct;
}

export interface PaceRange {
  fastSecPerMi: number;
  slowSecPerMi: number;
}

function secPerMiFromVo2(vo2: number): number {
  const velocity = velocityForVo2(vo2);
  return (60 / velocity) * METERS_PER_MILE;
}

function paceRangeForIntensity(
  vdot: number,
  lowPct: number,
  highPct: number,
): PaceRange {
  return {
    fastSecPerMi: secPerMiFromVo2(vdot * highPct),
    slowSecPerMi: secPerMiFromVo2(vdot * lowPct),
  };
}

export interface TrainingPaces {
  easy: PaceRange;
  marathon: PaceRange;
  threshold: PaceRange;
  interval: PaceRange;
  repetition: PaceRange;
}

const INTENSITY_BANDS: Record<keyof TrainingPaces, [number, number]> = {
  easy: [0.59, 0.74],
  marathon: [0.82, 0.86],
  threshold: [0.86, 0.9],
  interval: [0.96, 1.0],
  repetition: [1.03, 1.07],
};

export function trainingPaces(vdot: number): TrainingPaces {
  return {
    easy: paceRangeForIntensity(vdot, ...INTENSITY_BANDS.easy),
    marathon: paceRangeForIntensity(vdot, ...INTENSITY_BANDS.marathon),
    threshold: paceRangeForIntensity(vdot, ...INTENSITY_BANDS.threshold),
    interval: paceRangeForIntensity(vdot, ...INTENSITY_BANDS.interval),
    repetition: paceRangeForIntensity(vdot, ...INTENSITY_BANDS.repetition),
  };
}
