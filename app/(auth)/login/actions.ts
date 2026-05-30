"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { Database } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Shared helper: upsert user profile in the `users` table.
// Uses an untyped client (same pattern as /api/auth/callback) to avoid the
// @supabase/supabase-js v2 generic collapse that turns Insert into never[].
// ---------------------------------------------------------------------------
async function upsertProfile(
  userId: string,
  email: string,
  username: string,
  avatarUrl: string | null,
  credits?: number
) {
  const cookieStore = await cookies();
  // Intentionally untyped <Database> to avoid the TypeScript generic collapse
  // on .upsert() that occurs when using createClient<Database> in Server Actions.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component context — safe to ignore.
          }
        },
      },
    }
  );

  const payload: any = { id: userId, email, username, avatar_url: avatarUrl };
  if (credits !== undefined) {
    payload.credits = credits;
  }

  const { error } = await supabase.from("users").upsert(
    payload,
    { onConflict: "id", ignoreDuplicates: false }
  );

  if (error) {
    // Non-fatal: user is authenticated even if profile upsert fails
    console.error("[auth] Failed to upsert user profile:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Method B: Email & Password — SIGN UP (new account)
// ---------------------------------------------------------------------------
export async function signUp(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const adminAuth = createAdminClient().auth;
  const { data: adminData, error: createError } = await adminAuth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered")) {
      return {
        error: "An account with this email already exists. Please sign in instead.",
      };
    }
    return { error: createError.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const user = data.user;
  if (user) {
    const username =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      email.split("@")[0] ??
      "User";
    await upsertProfile(user.id, user.email!, username, null);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Method B: Email & Password — SIGN IN (existing account)
// ---------------------------------------------------------------------------
export async function signInWithPassword(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid login credentials") ||
      error.message.toLowerCase().includes("invalid_grant")
    ) {
      return { error: "Incorrect email or password. Please try again." };
    }
    return { error: error.message };
  }

  const user = data.user;
  if (user) {
    const username =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "User";
    await upsertProfile(
      user.id,
      user.email!,
      username,
      user.user_metadata?.avatar_url ?? null
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// ---------------------------------------------------------------------------
// Method C: Guest Login — auto-generated credentials, instant access
// ---------------------------------------------------------------------------
export async function loginAsGuest(): Promise<{ error: string | null }> {
  const uuid = randomUUID();
  const guestEmail = `guest-${uuid}@guest.giveawayapp.com`;
  // UUID + suffix → 40+ character cryptographically random password
  const guestPassword = `${randomUUID()}-Gst!`;

  const adminAuth = createAdminClient().auth;
  const { data: adminData, error: createError } = await adminAuth.admin.createUser({
    email: guestEmail,
    password: guestPassword,
    email_confirm: true,
    user_metadata: { full_name: "Guest", is_guest: true },
  });

  if (createError) {
    return { error: `Guest creation failed: ${createError.message}` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password: guestPassword,
  });

  if (error) {
    return { error: `Guest login failed: ${error.message}` };
  }

  const user = data.user;
  if (user) {
    await upsertProfile(user.id, user.email!, "Guest", null, 20);
  }

  revalidatePath("/", "layout");
  redirect("/");
}
