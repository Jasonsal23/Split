"use client";

import { useRef, useState, useTransition } from "react";
import { completeOnboarding } from "./actions";
import { DAYS_OF_WEEK, DAY_LABELS, type RaceCatalogEntry } from "@/lib/types";
import RaceSearch from "@/components/race-search";

const STEP_LABELS = ["Goal", "Baseline", "Availability", "Heart rate", "Disclaimer"];

const DISTANCE_PRESETS = [
  { label: "5K", value: "3.1" },
  { label: "10K", value: "6.2" },
  { label: "Half marathon", value: "13.1" },
  { label: "Marathon", value: "26.2" },
  { label: "Custom", value: "custom" },
];

function timeFieldsToSeconds(
  form: HTMLFormElement,
  prefix: string,
): number | null {
  const h = Number(
    (form.elements.namedItem(`${prefix}_hh`) as HTMLInputElement | null)
      ?.value || 0,
  );
  const m = Number(
    (form.elements.namedItem(`${prefix}_mm`) as HTMLInputElement | null)
      ?.value || 0,
  );
  const s = Number(
    (form.elements.namedItem(`${prefix}_ss`) as HTMLInputElement | null)
      ?.value || 0,
  );
  const total = h * 3600 + m * 60 + s;
  return total > 0 ? total : null;
}

const inputClass =
  "min-h-[44px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-base text-zinc-100 placeholder:text-zinc-600 w-full";
const labelClass = "flex flex-col gap-1 text-sm text-zinc-400";

export default function OnboardingWizard() {
  const formRef = useRef<HTMLFormElement>(null);
  const raceDateRef = useRef<HTMLInputElement>(null);
  const customDistanceRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [raceName, setRaceName] = useState("");
  const [distancePreset, setDistancePreset] = useState("26.2");
  const [goalType, setGoalType] = useState<"finish" | "time">("time");
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCatalogSelect(entry: RaceCatalogEntry) {
    setRaceName(entry.race_name);
    if (raceDateRef.current) raceDateRef.current.value = entry.race_date;

    const preset = DISTANCE_PRESETS.find(
      (p) => p.value !== "custom" && Math.abs(Number(p.value) - entry.race_distance_mi) < 0.15,
    );
    if (preset) {
      setDistancePreset(preset.value);
    } else {
      setDistancePreset("custom");
      if (customDistanceRef.current) {
        customDistanceRef.current.value = String(entry.race_distance_mi);
      }
    }
  }

  function goNext() {
    setStepError(null);
    const form = formRef.current;
    if (!form) return;

    if (step === 0) {
      const raceName = (
        form.elements.namedItem("race_name") as HTMLInputElement
      ).value;
      const raceDate = (
        form.elements.namedItem("race_date") as HTMLInputElement
      ).value;
      if (!raceName || !raceDate) {
        setStepError("Race name and date are required.");
        return;
      }
      if (distancePreset === "custom") {
        const custom = (
          form.elements.namedItem("race_distance_custom") as HTMLInputElement
        ).value;
        if (!custom || Number(custom) <= 0) {
          setStepError("Enter a race distance in miles.");
          return;
        }
      }
    }

    if (step === 1) {
      const weeklyMiles = (
        form.elements.namedItem("weekly_miles") as HTMLInputElement
      ).value;
      const longestRun = (
        form.elements.namedItem("longest_recent_run") as HTMLInputElement
      ).value;
      if (weeklyMiles === "" || longestRun === "") {
        setStepError("Weekly miles and longest recent run are required.");
        return;
      }
    }

    if (step === 2) {
      const checked = form.querySelectorAll(
        'input[name="preferred_days"]:checked',
      );
      if (checked.length === 0) {
        setStepError("Select at least one day.");
        return;
      }
    }

    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit(formData: FormData) {
    const form = formRef.current;
    if (!form) return;
    setSubmitError(null);

    if (distancePreset === "custom") {
      const custom = formData.get("race_distance_custom");
      if (custom) formData.set("race_distance_mi", String(custom));
    } else {
      formData.set("race_distance_mi", distancePreset);
    }

    const goalTimeSec = timeFieldsToSeconds(form, "goal_time");
    if (goalTimeSec !== null) formData.set("goal_time_sec", String(goalTimeSec));

    const raceTimeSec = timeFieldsToSeconds(form, "recent_race_time");
    if (raceTimeSec !== null)
      formData.set("recent_race_time_s", String(raceTimeSec));

    const paceSec = timeFieldsToSeconds(form, "est_mile_pace");
    if (paceSec !== null) formData.set("est_mile_pace_sec", String(paceSec));

    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if (result?.error) setSubmitError(result.error);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
        </p>
        <div className="mt-2 flex gap-1">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-zinc-100" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 0: Goal race */}
      <div className={step === 0 ? "space-y-4" : "hidden"}>
        <RaceSearch value={raceName} onChange={setRaceName} onSelect={handleCatalogSelect} />
        <label className={labelClass}>
          Race date
          <input ref={raceDateRef} name="race_date" type="date" className={inputClass} />
        </label>
        <label className={labelClass}>
          Distance
          <select
            value={distancePreset}
            onChange={(e) => setDistancePreset(e.target.value)}
            className={inputClass}
          >
            {DISTANCE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {distancePreset === "custom" && (
          <label className={labelClass}>
            Custom distance (mi)
            <input
              ref={customDistanceRef}
              name="race_distance_custom"
              type="number"
              step="0.1"
              min="0.1"
              className={inputClass}
            />
          </label>
        )}
        <fieldset className="space-y-2">
          <legend className="text-sm text-zinc-400">Goal</legend>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name="goal_type"
              value="time"
              checked={goalType === "time"}
              onChange={() => setGoalType("time")}
            />
            Target time
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="radio"
              name="goal_type"
              value="finish"
              checked={goalType === "finish"}
              onChange={() => setGoalType("finish")}
            />
            Just finish
          </label>
        </fieldset>
        {goalType === "time" && (
          <div>
            <p className={labelClass}>Target time (h : m : s)</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <input
                name="goal_time_hh"
                type="number"
                min="0"
                placeholder="3"
                className={inputClass}
              />
              <input
                name="goal_time_mm"
                type="number"
                min="0"
                max="59"
                placeholder="30"
                className={inputClass}
              />
              <input
                name="goal_time_ss"
                type="number"
                min="0"
                max="59"
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* Step 1: Baseline */}
      <div className={step === 1 ? "space-y-4" : "hidden"}>
        <label className={labelClass}>
          Current weekly miles
          <input
            name="weekly_miles"
            type="number"
            step="0.1"
            min="0"
            placeholder="0 is valid"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Longest run in the last 30 days (mi)
          <input
            name="longest_recent_run"
            type="number"
            step="0.1"
            min="0"
            className={inputClass}
          />
        </label>
        <div>
          <p className={labelClass}>
            Recent race distance (mi, optional but gold if you have it)
          </p>
          <input
            name="recent_race_dist"
            type="number"
            step="0.1"
            min="0"
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <p className={labelClass}>Recent race time (h : m : s, optional)</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <input name="recent_race_time_hh" type="number" min="0" className={inputClass} />
            <input name="recent_race_time_mm" type="number" min="0" max="59" className={inputClass} />
            <input name="recent_race_time_ss" type="number" min="0" max="59" className={inputClass} />
          </div>
        </div>
        <div>
          <p className={labelClass}>
            Honest guess at your mile pace (m : s, optional)
          </p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input name="est_mile_pace_mm" type="number" min="0" placeholder="min" className={inputClass} />
            <input name="est_mile_pace_ss" type="number" min="0" max="59" placeholder="sec" className={inputClass} />
          </div>
        </div>
        <label className={labelClass}>
          Injury notes (optional)
          <textarea name="injury_notes" rows={2} className={inputClass} />
        </label>
      </div>

      {/* Step 2: Days available */}
      <div className={step === 2 ? "space-y-4" : "hidden"}>
        <p className="text-sm text-zinc-400">
          Which days could you run on? The coach still decides how many of
          these you actually should run each week.
        </p>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => (
            <label
              key={day}
              className="flex min-h-[44px] items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200"
            >
              <input
                type="checkbox"
                name="preferred_days"
                value={day}
                defaultChecked={day !== "sat" && day !== "sun"}
              />
              {DAY_LABELS[day]}
            </label>
          ))}
        </div>
      </div>

      {/* Step 3: HR info (skippable) */}
      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <p className="text-sm text-zinc-500">
          Optional — skip if you don&apos;t know these.
        </p>
        <label className={labelClass}>
          Birth year
          <input name="birth_year" type="number" placeholder="1990" className={inputClass} />
        </label>
        <label className={labelClass}>
          Resting heart rate
          <input name="resting_hr" type="number" placeholder="55" className={inputClass} />
        </label>
        <label className={labelClass}>
          Max heart rate
          <input name="max_hr" type="number" placeholder="185" className={inputClass} />
        </label>
      </div>

      {/* Step 4: Disclaimer */}
      <div className={step === 4 ? "space-y-4" : "hidden"}>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm leading-relaxed text-zinc-400">
          Split generates training suggestions using AI and your logged data.
          It is not a certified coach, physical therapist, or medical
          provider, and it cannot see how you actually feel. Talk to a
          doctor before starting a training program. Stop running and get
          medical advice if you have chest pain, dizziness, or pain that
          gets worse as you run. You are responsible for your own training
          decisions.
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input type="checkbox" name="accepted_disclaimer" required />
          I understand and accept.
        </label>
      </div>

      {stepError && <p className="text-sm text-red-400">{stepError}</p>}
      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-800 px-4 text-base font-medium text-zinc-300"
          >
            Back
          </button>
        )}
        {step < STEP_LABELS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="min-h-[44px] flex-1 rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[44px] flex-1 rounded-lg bg-zinc-100 px-4 text-base font-medium text-zinc-950 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Finish setup"}
          </button>
        )}
      </div>
    </form>
  );
}
