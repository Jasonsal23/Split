import { TOUR_ASSESSMENT, TOUR_FOCUS } from "@/app/tour/fake-data";

export default function CoachPreview() {
  return (
    <div className="space-y-4">
      <div className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-200">
        Regenerate this week&apos;s plan
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Latest assessment
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {TOUR_ASSESSMENT}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Focus
        </p>
        <p className="mt-2 text-sm text-zinc-300">{TOUR_FOCUS}</p>
      </div>
    </div>
  );
}
