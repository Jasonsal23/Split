import { cookies } from "next/headers";

export const DEFAULT_TIMEZONE = "America/Los_Angeles";
export const TIMEZONE_COOKIE = "tz";

/**
 * The visitor's IANA timezone, captured client-side (see the inline script
 * in the root layout) and read back here. Server code must never use a bare
 * `new Date()` as "today" — the server's clock is UTC, not the athlete's —
 * so every date-boundary computation should start from
 * `toZonedTime(new Date(), await getUserTimeZone())` instead.
 */
export async function getUserTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(TIMEZONE_COOKIE)?.value || DEFAULT_TIMEZONE;
}
