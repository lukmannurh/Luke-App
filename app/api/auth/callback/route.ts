import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/auth/callback
 *
 * Handles the Google OAuth redirect from Supabase Auth.
 * 1. Exchanges the auth `code` for a Supabase session (sets cookies)
 * 2. Upserts the user record into the `users` table
 * 3. Redirects to the dashboard (or the page the user originally tried to visit)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    // No code in URL — something went wrong with the OAuth flow
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the code for a session — this sets the auth cookies
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] Failed to exchange code:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const authUser = data.user;

  // Upsert the user into our `users` table.
  // This runs on every login to keep username and avatar up to date.
  const username =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    authUser.user_metadata?.avatar_url ||
    authUser.user_metadata?.picture ||
    null;

  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: authUser.id,
      email: authUser.email!,
      username,
      avatar_url: avatarUrl,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false, // always update username/avatar on login
    }
  );

  if (upsertError) {
    // Log but don't block — user is authenticated even if upsert fails
    console.error("[auth/callback] Failed to upsert user:", upsertError.message);
  }

  // Redirect to the intended page or home
  const redirectTo = next.startsWith("/") ? `${origin}${next}` : origin;
  return NextResponse.redirect(redirectTo);
}
