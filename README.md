# Split

**An adaptive running coach that rewrites your training plan based on how you actually ran — not a template you picked at signup.**

Log each run manually (distance, time, HR, effort), and Split recalculates your current fitness, compares it to your goal race, and regenerates the next block of training. It tells you honestly whether you're on track, and by how much.

Running only — no strength programming, no nutrition tracking, no calorie counting.

## How it works

1. **You log runs.** Distance, duration, average HR, perceived effort (RPE), and how it felt. Takes under 30 seconds.
2. **Deterministic math recomputes your fitness.** Every logged run — not just the ones the AI touches — updates a VDOT estimate, a predicted race time (Riegel formula), a rolling efficiency-factor trend (pace-per-heartbeat on easy runs), and an acute:chronic workload ratio (ACWR), all in pure functions with unit tests. No AI call needed for this — it happens instantly on every log.
3. **The AI coach explains and adapts, never invents.** When you generate a plan, a compact JSON summary (fitness numbers, recent runs, constraints) — never raw run rows — goes to Claude, which returns a structured week of workouts and an honest assessment. It never gets to invent a pace or a mileage number; the app clamps everything server-side against safety rules before it's saved. If your goal time isn't realistic, the assessment says so and names a number that is.
4. **Weekly checkpoints happen automatically.** A Vercel Cron job recomputes a fitness snapshot for every athlete every week, regardless of whether they logged a run, so the progress trend never has gaps.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Styling | Tailwind CSS, mobile-first |
| Backend / DB | Supabase (Postgres + Auth + Row-Level Security) |
| AI | Anthropic API (Claude), server-only route |
| Charts | Recharts |
| Dates | date-fns |
| Validation | Zod at every API boundary |
| Tests | Vitest — every training-math function has a hand-checked expected value |

All training logic lives in framework-agnostic pure functions under `src/lib/training/` — no DB calls, no fetch, no React — so a future native shell could reuse it directly.

## Core features

- **Manual run logging** (`/log`) with offline support — if you're out of signal, the entry queues locally and syncs automatically the moment you're back online, from any page in the app.
- **Adaptive weekly plans** (`/coach`, `/plan`, `/today`) generated from your actual training data, with hard safety rules enforced in code:
  - Weekly mileage capped at +10% week-over-week (+5% after a rough/bad hard effort)
  - Long run never exceeds 35% of weekly volume
  - Max 2 hard sessions per week, never on consecutive days
  - 3 consecutive "bad" runs holds volume flat instead of increasing it
  - ACWR > 1.4 forces a cutback week
- **Multiple goal races.** Add more than one race in Settings — training always targets the soonest one, and the AI coach is told about the rest so it can plan the transition into the next block once the current race passes.
- **A shared, crowdsourced race directory.** Search-as-you-type when adding a race; picking a match autofills the date and distance. Every race anyone adds — including the World Marathon Majors, pre-seeded with officially confirmed dates — becomes searchable for everyone else.
- **Progress charts** (`/progress`): predicted finish time converging toward your goal, weekly mileage, and efficiency-factor trend.
- **Units toggle** (mi/km) in Settings that instantly reconverts every distance and pace shown across the app; everything is still stored in miles internally per the app's storage convention.
- **PWA-installable**, dark-surface, high-contrast, tabular-figure numerals for pace/distance so digits don't jitter as they update.
- **CSV export** of logged runs by date range.

## Data model

Postgres via Supabase, RLS on every table (`auth.uid() = user_id`), migrations in `supabase/migrations/`:

- `profiles` — units preference, HR info, accent color, onboarding/disclaimer state
- `baselines` — the onboarding snapshot (current weekly mileage, longest recent run, available days, injury notes)
- `goals` — one row per race; multiple allowed, soonest date is always the active training target
- `runs` — every logged run, with derived pace/efficiency computed on read, never stored
- `plan_weeks` / `workouts` — the AI-generated weekly plan and its individual prescribed sessions
- `fitness_snapshots` — VDOT, predicted race time, ACWR, on-track flag; one per week minimum via cron, more often if you're logging runs
- `coach_messages` — assessments and warnings from each plan generation
- `race_catalog` — the shared, crowdsourced race directory (not user-scoped; readable by any signed-in athlete, append-only)

## The training math

All in `src/lib/training/`, each function unit-tested against a hand-checked value:

- **Riegel race prediction** — `T2 = T1 * (D2/D1)^1.06`, using the best available input: recent race → hardest recent effort → baseline estimate.
- **VDOT / training paces** (Daniels' formula) — easy, marathon, threshold, interval, and repetition pace ranges, never a single number.
- **Efficiency Factor** — `(distance / duration) / avg HR` on easy runs, tracked as a rolling 4-week trend; the primary adaptive signal for whether aerobic fitness is actually improving.
- **ACWR** — acute (7-day) load over chronic (28-day) load, with load weighted by intensity (easy 1.0, tempo 1.3, interval 1.5, race 1.8).
- **Periodization** — Base 40% → Build 35% → Peak 15% → Taper 10% (≥3 weeks for a marathon), with a deload every 4th week.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CRON_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only — never exposed to the client. `CRON_SECRET` authorizes the weekly snapshot cron (`/api/cron/snapshot`); set the same value in your Vercel project's environment variables so the scheduled job in `vercel.json` can authenticate.

### Database setup

Run the SQL files in `supabase/migrations/` in order against your Supabase project (SQL Editor, or the Supabase CLI). This creates every table, RLS policy, and the seeded race catalog.

### Tests

```bash
npm run test
npm run lint
npm run build
```

## Deployment

Deployed on Vercel. `vercel.json` schedules the weekly fitness-snapshot cron. Auth email templates (sign-up confirmation, password reset) live in `supabase/email-templates/` — apply them via the Supabase dashboard once custom SMTP is configured; until then, Supabase's default templates are used.

## Disclaimer

Split generates training suggestions using AI and logged data. It is not a certified coach, physical therapist, or medical provider, and it cannot see how you actually feel. Talk to a doctor before starting a training program.
