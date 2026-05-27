import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/auth/signout
 *
 * Signs the user out of Supabase Auth and clears the session cookie.
 * Redirects to the login page.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const { origin } = request.nextUrl;

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

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[auth/signout] Sign-out error:", error.message);
    // Still redirect — the client-side session is cleared regardless
  }

  return NextResponse.redirect(`${origin}/login`);
}
