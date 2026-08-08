import { z } from "zod";

export const coachWorkoutSchema = z.object({
  scheduled_date: z.string().min(1),
  run_type: z.enum(["easy", "long", "tempo", "interval", "recovery", "race"]),
  target_distance_mi: z.number().positive(),
  target_pace_low_s: z.number().int().positive(),
  target_pace_high_s: z.number().int().positive(),
  // Null when there isn't enough HR data to responsibly propose a target —
  // clamped/validated in code before it's ever trusted, same as pace.
  target_hr_low: z.number().int().positive().nullable(),
  target_hr_high: z.number().int().positive().nullable(),
  description: z.string().min(1),
});

export const coachResponseSchema = z.object({
  assessment: z.string().min(1),
  on_track: z.boolean(),
  revised_goal_sec: z.number().int().positive().nullable(),
  week: z.object({
    target_miles: z.number().positive(),
    is_deload: z.boolean(),
    // Can legitimately be empty: if generating later in the week means the
    // athlete's preferred days have already passed, there may be nothing
    // left to schedule until next week — see COACH_SYSTEM_PROMPT.
    workouts: z.array(coachWorkoutSchema),
  }),
  focus: z.string().min(1),
  warnings: z.array(z.string()),
});

export type CoachWorkout = z.infer<typeof coachWorkoutSchema>;
export type CoachResponse = z.infer<typeof coachResponseSchema>;
