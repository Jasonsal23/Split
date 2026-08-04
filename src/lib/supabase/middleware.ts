import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/today",
  "/log",
  "/plan",
  "/progress",
  "/coach",
  "/settings",
  "/onboarding",
  "/reset-password",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) =>
      request.nextUrl.pathname === prefix ||
      request.nextUrl.pathname.startsWith(`${prefix}/`),
  );

  if (!user && isProtected) {
    // Send to the tour, not straight to login — a shared link to any
    // in-app page (e.g. /today) is often the first thing a stranger ever
    // sees, and they should get the "what is this" tour before a bare
    // sign-in form. The tour's final step still offers Log in / Sign up.
    const url = request.nextUrl.clone();
    url.pathname = "/tour";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
