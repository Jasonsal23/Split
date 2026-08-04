import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Baseline, Goal, Profile } from "@/lib/types";
import { getAccent } from "@/lib/accent-colors";
import { inputClass } from "@/lib/run-form";
import SignOutButton from "../sign-out-button";
import AccentPicker from "./accent-picker";
import AvatarUpload from "./avatar-upload";
import PersonalInfoSection from "./personal-info-section";
import GoalsSection from "./goals-section";
import PreferencesSection from "./preferences-section";
import UnitsSection from "./units-section";
import PasswordSection from "./password-section";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: goals }, { data: baseline }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user!.id)
      .returns<Profile[]>()
      .single(),
    supabase.from("goals").select("*").eq("is_active", true).returns<Goal[]>(),
    supabase
      .from("baselines")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<Baseline[]>()
      .maybeSingle(),
  ]);

  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || (user?.email?.[0].toUpperCase() ?? "?");

  const accent = getAccent(profile?.accent_color);
  const units = profile?.units ?? "mi";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-zinc-100">Profile</h1>

      <AvatarUpload
        userId={user!.id}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        ringClass={accent.ring}
      />

      <AccentPicker initialAccent={accent.key} />

      <PersonalInfoSection
        initial={{
          first_name: profile?.first_name ?? "",
          last_name: profile?.last_name ?? "",
          date_of_birth: profile?.date_of_birth ?? null,
          email: user?.email ?? "",
        }}
        accentBorderClass={accent.border}
      />

      {goals && goals.length > 0 ? (
        <GoalsSection goals={goals} units={units} accentBorderClass={accent.border} />
      ) : (
        <p className="text-sm text-zinc-500">
          Complete onboarding to set your race information here.
        </p>
      )}

      {baseline && (
        <PreferencesSection
          initialPreferredDays={baseline.preferred_days ?? []}
          accentBorderClass={accent.border}
        />
      )}

      <UnitsSection initialUnits={units} accentBorderClass={accent.border} />

      <PasswordSection accentBorderClass={accent.border} />

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Disclaimer
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Split generates training suggestions using AI and your logged data.
          It is not a certified coach, physical therapist, or medical
          provider, and it cannot see how you actually feel. Talk to a
          doctor before starting a training program. Stop running and get
          medical advice if you have chest pain, dizziness, or pain that
          gets worse as you run. You are responsible for your own training
          decisions.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Export data
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Download your logged runs as a CSV file. Leave the dates blank to
          export everything.
        </p>
        <form action="/api/export/runs" className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-zinc-400">
              Start date
              <input type="date" name="start" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-400">
              End date
              <input type="date" name="end" className={inputClass} />
            </label>
          </div>
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-lg border border-zinc-700 text-sm font-medium text-zinc-200"
          >
            Export CSV
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Help & contact
        </h2>
        <Link
          href="/tour"
          className="mt-3 flex min-h-[44px] w-full items-center justify-between rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200"
        >
          Replay the tour
          <span className="text-zinc-500">→</span>
        </Link>
        <Link
          href="/help"
          className="mt-3 flex min-h-[44px] w-full items-center justify-between rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200"
        >
          Help & FAQ
          <span className="text-zinc-500">→</span>
        </Link>
        <a
          href="mailto:builtbyjasondev@gmail.com"
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-200"
        >
          Contact: builtbyjasondev@gmail.com
        </a>
      </section>

      <SignOutButton />
    </div>
  );
}
