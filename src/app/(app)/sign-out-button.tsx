"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="min-h-[44px] w-full rounded-lg border border-zinc-800 text-sm font-medium text-red-400 hover:bg-zinc-900"
    >
      Sign out
    </button>
  );
}
