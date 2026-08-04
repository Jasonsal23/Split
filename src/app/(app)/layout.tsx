import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccent } from "@/lib/accent-colors";
import type { Profile } from "@/lib/types";
import Logo from "@/components/logo";
import OfflineSyncStatus from "./offline-sync-status";
import BottomNav from "./bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url, accent_color")
    .eq("id", user.id)
    .returns<
      Pick<Profile, "first_name" | "last_name" | "avatar_url" | "accent_color">[]
    >()
    .single();

  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || (user.email?.[0].toUpperCase() ?? "?");

  const accent = getAccent(profile?.accent_color);

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(var(--app-vh, 100dvh) - env(safe-area-inset-top))" }}
    >
      <header className="shrink-0 border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/today" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Split
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className={`h-8 w-8 overflow-hidden rounded-full bg-zinc-800 ring-2 ring-offset-2 ring-offset-zinc-950 ${accent.ring}`}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-400">
                  {initials}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <OfflineSyncStatus />
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
