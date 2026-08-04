"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Greeting({ firstName }: { firstName: string | null }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-100">
        {greetingForHour(now.getHours())}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-1 text-sm tabular-nums text-zinc-500">
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}{" "}
        · {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}
