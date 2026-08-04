import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "./onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .single();

    if (profile?.onboarded_at) {
      redirect("/today");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Set up your training</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Your goal race and current fitness — this is what the plan gets
          built from.
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
