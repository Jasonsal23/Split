import { createClient } from "@/lib/supabase/server";
import TourClient from "./tour-client";

export default async function TourPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <TourClient isLoggedIn={Boolean(user)} />;
}
