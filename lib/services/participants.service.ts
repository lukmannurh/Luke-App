/**
 * Participant Service — joining rooms and number selection.
 *
 * The primary race condition defense is the database-level UNIQUE constraint
 * on (room_id, selected_number). This service lets the DB handle atomicity —
 * no application-level locking required.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Participant, ParticipantWithUser } from "@/lib/types";
import {
  notFoundError,
  forbiddenError,
  conflictError,
  validationError,
  internalError,
  isUniqueConstraintError,
} from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDB = SupabaseClient<any>;

// ──────────────────────────────────────────────
// joinRoom
// ──────────────────────────────────────────────

/**
 * Joins a room and selects a number for the current user.
 *
 * Validation order (fail-fast, cheapest checks first):
 * 1. Fetch room — verify it exists and is active with a future deadline
 * 2. Validate selectedNumber is within the room's range
 * 3. INSERT into participants — UNIQUE constraints handle race conditions atomically
 *    - UNIQUE(room_id, selected_number) → 409 "Number already taken"
 *    - UNIQUE(room_id, user_id)         → 409 "Already joined this room"
 *
 * @throws notFoundError if room doesn't exist
 * @throws forbiddenError if room is not active or deadline has passed
 * @throws validationError if number is out of range
 * @throws conflictError if number is taken or user already joined
 */
export async function joinRoom(
  supabase: SupabaseDB,
  roomId: string,
  userId: string,
  selectedNumber: number
): Promise<Participant> {
  // Step 1: Fetch the room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, state, deadline, min_number, max_number")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    if (roomError?.code === "PGRST116") throw notFoundError("Room");
    logger.error("[participants.service] joinRoom fetch room error", roomError ?? undefined, { roomId });
    throw internalError("Failed to load room.");
  }

  // Step 2: Validate room state (server-side, not relying solely on RLS)
  if (room.state !== "active") {
    throw forbiddenError(
      room.state === "drawing"
        ? "The drawing is already in progress. Number selection is closed."
        : "This room's drawing has finished. You can no longer join."
    );
  }

  if (new Date(room.deadline) <= new Date()) {
    throw forbiddenError(
      "The deadline for this room has passed. Number selection is closed."
    );
  }

  // Step 3: Validate number range
  if (
    !Number.isInteger(selectedNumber) ||
    selectedNumber < room.min_number ||
    selectedNumber > room.max_number
  ) {
    throw validationError(
      `Please select a number between ${room.min_number} and ${room.max_number}.`,
      { selectedNumber: `Must be between ${room.min_number} and ${room.max_number}` }
    );
  }

  // Step 4: Insert — let UNIQUE constraints atomically reject duplicates
  const { data: participant, error: insertError } = await supabase
    .from("participants")
    .insert({
      room_id: roomId,
      user_id: userId,
      selected_number: selectedNumber,
    })
    .select()
    .single();

  if (insertError) {
    if (isUniqueConstraintError(insertError)) {
      // Determine which constraint was violated
      const detail = (insertError as any).details ?? "";
      if (detail.includes("selected_number") || detail.includes("room_id, selected_number")) {
        throw conflictError(
          `Number ${selectedNumber} has just been taken by someone else. Please choose a different number.`
        );
      }
      // Default: user already joined
      throw conflictError("You have already joined this room with a different number.");
    }
    logger.error("[participants.service] joinRoom insert error", insertError, {
      roomId,
      userId,
      selectedNumber,
    });
    throw internalError("Failed to join room. Please try again.");
  }

  logger.info("[participants.service] User joined room", {
    roomId,
    userId,
    selectedNumber,
  });

  return participant as Participant;
}

// ──────────────────────────────────────────────
// getParticipants
// ──────────────────────────────────────────────

/**
 * Returns all participants in a room, with their user info.
 */
export async function getParticipants(
  supabase: SupabaseDB,
  roomId: string
): Promise<ParticipantWithUser[]> {
  const { data, error } = await supabase
    .from("participants")
    .select(
      `
      id, room_id, user_id, selected_number, joined_at,
      user:users(id, username, avatar_url)
    `
    )
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) {
    logger.error("[participants.service] getParticipants error", error, { roomId });
    throw internalError("Failed to load participants.");
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    room_id: p.room_id,
    user_id: p.user_id,
    selected_number: p.selected_number,
    joined_at: p.joined_at,
    user: {
      id: p.user?.id ?? p.user_id,
      username: p.user?.username ?? "Unknown",
      avatar_url: p.user?.avatar_url ?? null,
    },
  }));
}

// ──────────────────────────────────────────────
// getAvailableNumbers
// ──────────────────────────────────────────────

/**
 * Returns the list of numbers NOT yet selected in a room.
 * Calculated from the room's min/max range minus taken numbers.
 *
 * Used by the NumberGrid/NumberDropdown to show availability.
 * Only called for rooms with range ≤ 500 (larger ranges use NumberInput).
 */
export async function getAvailableNumbers(
  supabase: SupabaseDB,
  roomId: string,
  minNumber: number,
  maxNumber: number
): Promise<{
  takenNumbers: number[];
  availableNumbers: number[];
  total: number;
  taken: number;
  available: number;
}> {
  const { data, error } = await supabase
    .from("participants")
    .select("selected_number")
    .eq("room_id", roomId);

  if (error) {
    logger.error("[participants.service] getAvailableNumbers error", error, { roomId });
    throw internalError("Failed to load number availability.");
  }

  const takenNumbers = (data ?? []).map((p) => p.selected_number);
  const takenSet = new Set(takenNumbers);

  const total = maxNumber - minNumber + 1;

  // Only compute full list for manageable ranges (≤ 500)
  let availableNumbers: number[] = [];
  if (total <= 500) {
    for (let n = minNumber; n <= maxNumber; n++) {
      if (!takenSet.has(n)) availableNumbers.push(n);
    }
  }

  return {
    takenNumbers,
    availableNumbers,
    total,
    taken: takenNumbers.length,
    available: total - takenNumbers.length,
  };
}

// ──────────────────────────────────────────────
// isNumberAvailable
// ──────────────────────────────────────────────

/**
 * Checks if a specific number is still available in a room.
 * Used by NumberInput (> 500 range) before confirming a selection.
 */
export async function isNumberAvailable(
  supabase: SupabaseDB,
  roomId: string,
  number: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("participants")
    .select("id")
    .eq("room_id", roomId)
    .eq("selected_number", number)
    .maybeSingle();

  if (error) {
    logger.error("[participants.service] isNumberAvailable error", error, { roomId, number });
    throw internalError("Failed to check number availability.");
  }

  return data === null; // null means no row found → number is available
}
