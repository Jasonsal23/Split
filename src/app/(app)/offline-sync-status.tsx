"use client";

import { useEffect, useState } from "react";
import { logRun } from "./log/actions";
import { getQueuedRuns, removeQueuedRun } from "@/lib/offline-queue";

/**
 * Flushes any runs saved locally while offline (see log-form.tsx) once the
 * connection returns, from wherever in the app the athlete happens to be —
 * not just the /log page they queued it from.
 */
export default function OfflineSyncStatus() {
  const [pending, setPending] = useState(getQueuedRuns);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    async function flush() {
      if (!navigator.onLine) return;
      const queue = getQueuedRuns();
      if (queue.length === 0) return;

      let syncedAny = false;
      for (const entry of queue) {
        const formData = new FormData();
        Object.entries(entry.fields).forEach(([key, value]) => formData.set(key, value));
        try {
          const result = await logRun(formData);
          if (!result.error) {
            removeQueuedRun(entry.id);
            syncedAny = true;
          }
        } catch {
          break; // still unreachable — leave the rest queued, retry on next reconnect
        }
      }

      setPending(getQueuedRuns());
      if (syncedAny) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
    }

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  if (pending.length === 0 && !justSynced) return null;

  return (
    <div
      className={`mx-auto mb-3 w-full max-w-lg rounded-lg border px-4 py-2 text-center text-xs font-medium ${
        pending.length === 0
          ? "border-emerald-900 bg-emerald-950/30 text-emerald-300"
          : "border-amber-900 bg-amber-950/30 text-amber-300"
      }`}
    >
      {pending.length > 0
        ? `${pending.length} run${pending.length > 1 ? "s" : ""} saved offline — syncing when connected...`
        : "Offline run synced."}
    </div>
  );
}
