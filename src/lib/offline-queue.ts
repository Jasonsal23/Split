const STORAGE_KEY = "split:offline-run-queue";

export interface QueuedRun {
  id: string;
  queuedAt: string;
  fields: Record<string, string>;
}

function readQueue(): QueuedRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRun[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedRun[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function queueRun(fields: Record<string, string>): QueuedRun {
  const entry: QueuedRun = {
    id: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    fields,
  };
  writeQueue([...readQueue(), entry]);
  return entry;
}

export function getQueuedRuns(): QueuedRun[] {
  return readQueue();
}

export function removeQueuedRun(id: string) {
  writeQueue(readQueue().filter((r) => r.id !== id));
}
