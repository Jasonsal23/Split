import Link from "next/link";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What do the tabs do?",
    a: "Today shows your current fitness, this week's mileage, and today's prescribed workout. Plan is a calendar of every workout, past and upcoming. Progress charts your predicted finish time, weekly mileage, and efficiency over time. Coach is where you generate a new week of workouts and read the coach's assessment. Profile is your account, race info, and preferences.",
  },
  {
    q: "How do I log a run?",
    a: "Tap \"Log your run\" on the Today tab, or open any day on the Plan calendar and tap the same button there. There's no separate \"Log\" tab on purpose — logging always starts from the day it belongs to.",
  },
  {
    q: "Can I edit a run after I've logged it?",
    a: "Yes. Open that day on the Plan calendar, find the run, and tap Edit. Change anything and hit Save — your fitness numbers recalculate automatically, for free, no AI call involved.",
  },
  {
    q: "What's the difference between Month and Week view on Plan?",
    a: "Same calendar, different zoom level. Switching between them always snaps back to the current week/month — only the arrows move you forward or back in time. There's a \"Today\" shortcut next to the arrows if you've wandered off.",
  },
  {
    q: "What do \"rest,\" \"no plan,\" and \"n/a\" mean on the calendar?",
    a: "\"Rest\" is a real designed rest day inside a week the coach has generated. \"No plan\" means that week hasn't been generated yet. \"N/A\" means the day is before you logged your very first run — there's nothing to show.",
  },
  {
    q: "How does the Coach generate my plan, and how often should I do it?",
    a: "Tap \"Generate this week's plan\" on the Coach tab whenever you want a fresh read — after a new week starts, after a big change in how training's felt, or whenever you're curious. It's an AI call, so there's no need to do it daily; logging runs and editing them update your numbers for free without touching Coach at all.",
  },
  {
    q: "Why didn't my predicted finish time change after an easy run?",
    a: "Predicted finish is based on your best real effort (a race, or a hard tempo/interval run) — that's the only evidence that can move it a lot. Easy runs still nudge it slightly based on your efficiency factor trend (pace per heartbeat), capped so a couple of noisy runs can't swing it wildly.",
  },
  {
    q: "How do I update my race, availability, or personal info?",
    a: "All on the Profile tab. Each section (Personal info, Race information, Running availability) is locked by default — tap Edit, make changes, then Save changes or Cancel.",
  },
  {
    q: "Is Split a replacement for a real coach or doctor?",
    a: "No. Split is not a certified coach, physical therapist, or medical provider, and it cannot see how you actually feel. Talk to a doctor before starting a training program, and stop running and get medical advice if you have chest pain, dizziness, or pain that gets worse as you run. You're responsible for your own training decisions.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-zinc-400 underline">
          ← Back to Profile
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">Help & FAQ</h1>
      </div>

      <div className="space-y-3">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-100 marker:content-none">
              <span className="flex items-center justify-between">
                {item.q}
                <span className="ml-3 shrink-0 text-zinc-500 group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Still stuck?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          For any technical issues, reach out directly.
        </p>
        <a
          href="mailto:builtbyjasondev@gmail.com"
          className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-200"
        >
          builtbyjasondev@gmail.com
        </a>
      </section>
    </div>
  );
}
