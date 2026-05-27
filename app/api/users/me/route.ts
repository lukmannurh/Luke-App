import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/services/users.service";
import { formatErrorResponse, unauthorizedError } from "@/lib/utils/errors";

// ──────────────────────────────────────────────
// GET /api/users/me
// Returns the current authenticated user's full profile with stats.
// ──────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    const profile = await getUserProfile(supabase, user.id);
    return NextResponse.json(profile, { status: 200 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
