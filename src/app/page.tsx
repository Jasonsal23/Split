import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/logo";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/today");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Logo className="h-14 w-14" />
      <h1 className="mt-6 max-w-xs text-2xl font-semibold text-zinc-100">
        Your training plan, rewritten by how you actually ran.
      </h1>
      <Link
        href="/login"
        className="mt-8 flex min-h-[44px] items-center rounded-lg bg-zinc-100 px-6 py-3 text-base font-medium text-zinc-950"
      >
        Get started
      </Link>
    </main>
  );
}
