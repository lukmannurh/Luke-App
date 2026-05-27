/**
 * User Service — profile, stats, and upsert on OAuth login.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, UserProfile, UserStats, ParticipationHistory } from "@/lib/types";
import { notFoundError, internalError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDB = SupabaseClient<any>;

// ──────────────────────────────────────────────
// upsertUser
// ──────────────────────────────────────────────

export interface AuthUserData {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
}

/**
 * Creates or updates a user record from OAuth login data.
 * Called from the /api/auth/callback route on every successful login.
 *
 * Uses upsert with onConflict:'id' to update username and avatar on re-login.
 */
export async function upsertUser(
  supabase: SupabaseDB,
  authUser: AuthUserData
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        id: authUser.id,
        email: authUser.email,
        username: authUser.username,
        avatar_url: authUser.avatarUrl ?? null,
      },
      { onConflict: "id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error || !data) {
    logger.error("[users.service] upsertUser error", error ?? undefined, {
      userId: authUser.id,
    });
    throw internalError("Failed to save user profile.");
  }

  return data as User;
}

// ──────────────────────────────────────────────
// getUserById
// ──────────────────────────────────────────────

/**
 * Fetches a user's public profile by ID.
 * @throws notFoundError if the user doesn't exist
 */
export async function getUserById(
  supabase: SupabaseDB,
  userId: string
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    if (error?.code === "PGRST116") throw notFoundError("User");
    logger.error("[users.service] getUserById error", error ?? undefined, { userId });
    throw internalError("Failed to load user profile.");
  }

  return data as User;
}

// ──────────────────────────────────────────────
// getUserProfile (with stats + participation history)
// ──────────────────────────────────────────────

/**
 * Returns a full user profile with stats and participation history.
 * Used by the /api/users/me endpoint and the profile page.
 *
 * Stats:
 * - totalParticipations: number of rooms joined
 * - totalWins: number of rooms won
 * - totalRoomsHosted: number of rooms created
 *
 * @throws notFoundError if the user doesn't exist
 */
export async function getUserProfile(
  supabase: SupabaseDB,
  userId: string
): Promise<UserProfile> {
  // Fetch user + their participations (with room info) in parallel
  const [userResult, participationsResult, winsResult, hostedResult] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),

      supabase
        .from("participants")
        .select(
          `
          id, room_id, selected_number, joined_at,
          room:rooms(id, title, state)
        `
        )
        .eq("user_id", userId)
        .order("joined_at", { ascending: false }),

      supabase
        .from("winners")
        .select("room_id")
        .eq("user_id", userId),

      supabase
        .from("rooms")
        .select("id", { count: "exact", head: true })
        .eq("host_id", userId),
    ]);

  if (userResult.error || !userResult.data) {
    if (userResult.error?.code === "PGRST116") throw notFoundError("User");
    logger.error("[users.service] getUserProfile user error", userResult.error ?? undefined, { userId });
    throw internalError("Failed to load user profile.");
  }

  const user = userResult.data as User;
  const participations = participationsResult.data ?? [];
  const wins = winsResult.data ?? [];
  const totalRoomsHosted = hostedResult.count ?? 0;

  const winRoomIds = new Set(wins.map((w) => w.room_id));

  const stats: UserStats = {
    totalParticipations: participations.length,
    totalWins: wins.length,
    totalRoomsHosted,
  };

  const participationHistory: ParticipationHistory[] = participations.map(
    (p: any) => ({
      roomId: p.room_id,
      roomTitle: p.room?.title ?? "Unknown Room",
      selectedNumber: p.selected_number,
      roomState: p.room?.state ?? "finished",
      isWinner: winRoomIds.has(p.room_id),
      joinedAt: p.joined_at,
    })
  );

  return {
    ...user,
    stats,
    participations: participationHistory,
  };
}
