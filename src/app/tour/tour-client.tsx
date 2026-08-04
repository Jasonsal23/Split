"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import TodayPreview from "./previews/today-preview";
import PlanPreview from "./previews/plan-preview";
import ProgressPreview from "./previews/progress-preview";
import CoachPreview from "./previews/coach-preview";
import SettingsPreview from "./previews/settings-preview";

const STEPS = [
  {
    label: "Today",
    caption: "Your day at a glance — this week's mileage, current fitness, and today's workout.",
  },
  {
    label: "Plan",
    caption: "A full week of prescribed workouts, always visible.",
  },
  {
    label: "Progress",
    caption: "Watch your predicted finish time converge toward your goal.",
  },
  {
    label: "Coach",
    caption: "A plain-language assessment after every plan regeneration — no hype.",
  },
  {
    label: "Profile",
    caption: "Race goals, preferred days, and units, all in one place.",
  },
];

export default function TourClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const isLast = step === STEPS.length - 1;

  function handleSkip() {
    router.push(isLoggedIn ? "/today" : "/login");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight text-zinc-100">Split</span>
        </Link>
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-zinc-500 underline"
        >
          Skip
        </button>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Step {step + 1} of {STEPS.length} · {STEPS[step].label}
        </p>
        <div className="mt-2 flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-zinc-100" : "bg-zinc-800"}`}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{STEPS[step].caption}</p>

      <div className="mt-4 flex-1">
        <div className={step === 0 ? "" : "hidden"}>
          <TodayPreview />
        </div>
        <div className={step === 1 ? "" : "hidden"}>
          <PlanPreview />
        </div>
        <div className={step === 2 ? "" : "hidden"}>
          <ProgressPreview />
        </div>
        <div className={step === 3 ? "" : "hidden"}>
          <CoachPreview />
        </div>
        <div className={step === 4 ? "" : "hidden"}>
          <SettingsPreview />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            className="min-h-[44px] flex-1 rounded-lg border border-zinc-800 text-sm font-medium text-zinc-300"
          >
            Back
          </button>
        )}

        {!isLast && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
            className="min-h-[44px] flex-1 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-950"
          >
            Next
          </button>
        )}

        {isLast && isLoggedIn && (
          <Link
            href="/today"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-zinc-100 text-sm font-medium text-zinc-950"
          >
            Done
          </Link>
        )}

        {isLast && !isLoggedIn && (
          <>
            <Link
              href="/login"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-zinc-800 text-sm font-medium text-zinc-300"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-zinc-100 text-sm font-medium text-zinc-950"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
