# CLAUDE.md — Adaptive Running Coach

> Working name: **Pacer** (rename freely). Drop this file in the repo root. Claude Code reads it automatically on every session.

---

## 1. What we're building

A running-only training app that **rewrites your plan based on how you actually ran**, not on a template you picked at signup.

The user logs each run manually (distance, time, average HR, effort). The app recalculates their current fitness, compares it to their goal race, and regenerates the next block of training. It tells them honestly whether they're on track.

**Scope guardrail:** running only. No strength programming, no nutrition tracking, no calorie counting. If a feature request doesn't touch running fitness, it's out of v1.

**First user:** the developer, training for a marathon in **January 2027**. Base-building starts August 2026; the formal block starts ~September 2026. The app must be usable _today_ for base logging, and switch into block mode when the block begins.

---

## 2. Non-negotiables

1. **Adaptive over prescriptive.** Every plan week is generated from logged data, never pulled from a static table.
2. **Honest feedback.** If the goal time isn't realistic, say so, with the number that is. Never flatter.
3. **Injury-conservative.** The app's bias is always toward less volume. See §7.
4. **Not a coach or doctor.** Disclaimer visible at onboarding and in settings. See §8.
5. **Mobile-first web now, native later.** Keep all business logic in framework-agnostic modules so a React Native shell can reuse it.

---

## 3. Stack

| Layer        | Choice                                                     | Notes                                 |
| ------------ | ------------------------------------------------------------ | -------------------------------------- |
| Framework    | **Next.js (App Router, TypeScript)**                       | Deploy on Vercel                      |
| Styling      | **Tailwind CSS**                                           | Mobile-first breakpoints only         |
| Backend / DB | **Supabase** (Postgres + Auth + RLS)                       | Email magic link auth for v1          |
| AI           | **Anthropic API** (`claude-sonnet-4-6`) via a server route | Never call from the client            |
| Charts       | **Recharts**                                               | Pace trend, weekly mileage, HR drift  |
| Dates        | **date-fns**                                               | All dates stored UTC, displayed local |
| Validation   | **Zod**                                                    | Every API boundary                    |

**Never** put `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in anything prefixed `NEXT_PUBLIC_`.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## 4. Data model

All tables have `id uuid default gen_random_uuid()`, `user_id uuid references auth.users`, `created_at timestamptz default now()`. **RLS on every table**, policy: `auth.uid() = user_id`.

### `profiles`

```
display_name        text
units               text        -- 'mi' | 'km', default 'mi'
birth_year          int         -- for HR max estimate, optional
resting_hr          int         -- optional
max_hr              int         -- optional; else estimate 208 - 0.7*age
onboarded_at        timestamptz
```

### `baselines` — the onboarding snapshot

```
weekly_miles        numeric     -- current avg, 0 is valid
longest_recent_run  numeric     -- miles in last 30 days
days_per_week       int         -- how many days they can run
est_mile_pace_sec   int         -- their honest guess, optional
recent_race_dist    numeric     -- optional but gold if present
recent_race_time_s  int         -- optional
injury_notes        text        -- free text, fed to AI as context
```

### `goals`

```
race_name           text
race_date           date
race_distance_mi    numeric     -- 26.2 for marathon
goal_time_sec        int
goal_type            text        -- 'finish' | 'time'
is_active            bool
```

### `runs` — manual entry from Garmin

```
run_date             date
distance_mi          numeric
duration_sec          int
avg_hr                 int         -- nullable
max_hr                  int         -- nullable
elevation_gain_ft       int         -- nullable
rpe                      int         -- 1-10 perceived effort, required
run_type                  text        -- 'easy'|'long'|'tempo'|'interval'|'recovery'|'race'
felt                       text        -- 'great'|'good'|'ok'|'rough'|'bad'
notes                       text
planned_workout_id          uuid        -- nullable link to what was prescribed
```

Derived on read, never stored: `pace_sec_per_mi`, `efficiency_factor`.

### `plan_weeks`

```
week_start           date
week_index           int         -- 1 = first week of block
phase                 text        -- 'base'|'build'|'peak'|'taper'|'race'
target_miles          numeric
is_deload             bool
generated_at          timestamptz
generation_reason     text        -- why the AI shaped it this way
```

### `workouts`

```
plan_week_id          uuid
scheduled_date         date
run_type                text
target_distance_mi      numeric
target_pace_low_s        int         -- pace range, per mile
target_pace_high_s       int
description               text        -- "3mi easy, 4x800 @ 5k pace, 1mi cool"
status                     text        -- 'planned'|'completed'|'skipped'|'modified'
```

### `fitness_snapshots` — computed weekly, powers the trend chart

```
snapshot_date          date
vdot                     numeric
predicted_race_sec        int
weekly_miles              numeric
acwr                       numeric
on_track                    bool
gap_sec                      int         -- predicted minus goal; positive = behind
```

### `coach_messages`

```
snapshot_id             uuid
role                      text        -- 'assessment'|'weekly_note'|'warning'
body                       text
```

---

## 5. The math (do this in code, not in the AI)

**Critical:** the AI does _not_ invent paces or mileage. Deterministic functions compute the numbers; the AI explains them and handles nuance. Put all of this in `/lib/training/` with unit tests.

### Riegel race prediction

`T2 = T1 * (D2/D1)^1.06`

Use the best available input in this priority: recent race → longest hard effort in last 60 days → best estimate from baseline.

### VDOT / training paces

Derive VDOT from the best recent performance (Daniels' formula), then set:

- **Easy:** 59–74% VO2max pace — the bulk of running (≥80% of weekly volume)
- **Marathon:** ~84%
- **Threshold/tempo:** ~88%
- **Interval:** ~98%
- **Repetition:** ~105%

Every prescribed workout gets a pace _range_, never a single number.

### Efficiency Factor (the adaptive signal)

`EF = (distance_meters / duration_sec) / avg_hr`

Rising EF on easy runs at steady HR = aerobic fitness improving. Track a 4-week rolling EF. This is the single most useful adaptation input, which is why avg HR matters.

### ACWR — acute:chronic workload ratio

`ACWR = (last 7 days load) / (avg weekly load over last 28 days)`

Load = `distance_mi * intensity_factor` where easy = 1.0, tempo = 1.3, interval = 1.5, race = 1.8.

- `< 0.8` → detraining, can add volume
- `0.8 – 1.3` → sweet spot
- `1.3 – 1.5` → caution, hold volume flat
- `> 1.5` → **hard block**, force a cutback week

### Periodization

Given weeks-until-race, split: **Base 40% → Build 35% → Peak 15% → Taper 10%** (taper always ≥ 2 weeks, 3 for a marathon). Every 4th week is a deload at ~70% volume. Longest long run: 20–22 mi, no earlier than 3 weeks out.

---

## 6. The AI layer

One server route: `POST /api/coach/generate`. It receives a **compact JSON summary** (never raw run rows — token waste), returns structured JSON only.

**System prompt shape:**

```
You are an experienced running coach reviewing an athlete's training data.
You are given computed metrics — trust them, do not recalculate.
Rules:
- Never prescribe a weekly mileage increase above the max_safe_miles provided.
- Never schedule hard days on back-to-back days.
- If ACWR > 1.4 or the athlete reports 2+ 'rough'/'bad' runs in 7 days, prioritize recovery.
- Be direct about goal feasibility. If gap_sec > 900, say plainly the goal needs revising and name a realistic target.
- Speak to the athlete, not about them. No hype, no exclamation marks.
Return ONLY valid JSON matching the schema. No markdown, no preamble.
```

**Input payload:**

```json
{
  "weeks_to_race": 22,
  "phase": "base",
  "goal": { "distance_mi": 26.2, "goal_time_sec": 12600 },
  "fitness": {
    "vdot": 42.1,
    "predicted_race_sec": 13840,
    "gap_sec": 1240,
    "ef_trend_pct": 2.4,
    "acwr": 1.12
  },
  "last_4_weeks_miles": [18, 22, 24, 19],
  "recent_runs": [
    {
      "date": "...",
      "mi": 6.2,
      "pace_s": 528,
      "hr": 148,
      "rpe": 5,
      "felt": "good"
    }
  ],
  "constraints": {
    "days_per_week": 5,
    "max_safe_miles": 26.4,
    "injury_notes": "..."
  }
}
```

**Output schema:** `{ assessment, on_track, revised_goal_sec, week: { target_miles, is_deload, workouts: [...] }, focus, warnings[] }`

**Validate the response with Zod and clamp it.** If the AI returns mileage above `max_safe_miles`, clamp it and log. The code is the safety net, not the model.

**When to regenerate:** on demand, on the first log of a new week, and whenever ACWR crosses 1.4.

---

## 7. Safety rules (enforced in code, always)

- Weekly mileage increase capped at **10%** week-over-week; **5%** if any run in the last 7 days is `rpe ≥ 8` with `felt` = rough/bad.
- Absolute first-4-weeks cap: never more than `baseline.weekly_miles * 1.10`, and never above 15 mi/wk for a user starting from 0.
- Long run never exceeds **35%** of weekly volume.
- Max 2 hard sessions per week, never consecutive days.
- Three consecutive `felt: 'bad'` runs → app surfaces a rest recommendation and refuses to increase volume.
- Missed a week+? Regenerate downward, don't resume where the plan left off.

---

## 8. Legal / disclaimer

Shown as a blocking checkbox at onboarding, and in Settings:

> Pacer generates training suggestions using AI and your logged data. It is not a certified coach, physical therapist, or medical provider, and it cannot see how you actually feel. Talk to a doctor before starting a training program. Stop running and get medical advice if you have chest pain, dizziness, or pain that gets worse as you run. You are responsible for your own training decisions.

Store `accepted_disclaimer_at` on the profile. Also add a short line in the footer of any AI-generated assessment.

---

## 9. Screens (v1)

| Route         | Job                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| `/`           | Landing: one sentence, one button. Logged-in users redirect to `/today`.          |
| `/onboarding` | 5 steps: goal race → baseline → days available → HR info (skippable) → disclaimer |
| `/today`      | Today's prescribed workout, big and unmissable. One tap to "Log this run."        |
| `/log`        | Fast manual entry. Prefills from the planned workout. Should take <30 seconds.    |
| `/plan`       | Current week + next 3 weeks. Shows phase and deload weeks.                        |
| `/progress`   | Predicted finish vs goal over time, weekly mileage bars, EF trend                 |
| `/coach`      | Latest assessment + history of coach messages                                     |
| `/settings`   | Units, HR, goal edit, disclaimer, export data                                     |

**Design direction:** this is a data instrument you look at sweaty, outdoors, one-handed. Dark surface, high-contrast numerals, generous tap targets (44px min). Give pace and distance a tabular-figure display face so numbers don't jitter as they update; keep body copy in a plain, quiet sans. The one signature element: on `/progress`, a single line showing predicted finish time converging (or not) toward the goal line as race day approaches — that chart is the whole product thesis, so let it be the boldest thing on screen and keep everything else restrained. No gradients, no medals, no confetti.

---

## 10. Build order

**Ship in this sequence. Do not start a phase before the previous one runs.**

1. **Scaffold** — Next.js + TS + Tailwind, Supabase client, auth (magic link), protected layout.
2. **Schema** — SQL migration for all tables + RLS policies. Verify a second user can't read row one.
3. **Logging loop** — `/log` and a run list. This alone is useful today; start logging real runs here.
4. **Math module** — `/lib/training/` with Riegel, VDOT, paces, EF, ACWR + Vitest tests. No UI.
5. **Onboarding + goal** — baseline capture, first fitness snapshot computed.
6. **AI generation** — the coach route, Zod validation, clamping, `/plan` and `/today` rendering real workouts.
7. **Progress** — snapshots on a weekly cron (Vercel cron), charts, the convergence view.
8. **Polish** — empty states, offline-tolerant logging, PWA manifest so it installs to the home screen.

---

## 11. Conventions for Claude Code

- TypeScript strict. No `any`. Zod-infer types at boundaries.
- Server Components by default; `'use client'` only for interactivity.
- All training logic is **pure functions** in `/lib/training/` — no DB, no fetch, no React. This is what ports to native later.
- Distances stored in **miles**, durations in **seconds**, paces in **seconds per mile**. Convert only at the display layer.
- Every math function gets a Vitest test with a hand-checked expected value before it's used in a route.
- Explain each step as you go: what you're building, why, and what to verify before moving on. The developer is learning this stack, not just shipping it.
- Ask before adding a dependency not listed in §3.

---

## 12. Explicitly out of scope for v1

Garmin/Strava API sync · social feed · paid tiers · strength or cross-training · nutrition · shoe mileage tracking · automatic cross-race periodization (phase/mileage transitions still require manually regenerating the plan after a race) · Apple Health · push notifications

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
