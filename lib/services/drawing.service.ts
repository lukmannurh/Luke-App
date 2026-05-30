/**
 * Drawing Service — executes the giveaway drawing with full double-draw prevention.
 *
 * This service MUST be called with the Supabase admin/service-role client,
 * because it needs to:
 * - UPDATE rooms.state (no UPDATE RLS policy for authenticated role)
 * - INSERT winners (no INSERT RLS policy for authenticated role)
 *
 * Never call this from a client-facing context.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DrawingResult } from "@/lib/types";
import { selectWinners } from "@/lib/utils/rng";
import { forbiddenError, notFoundError, internalError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDB = SupabaseClient<any>;

/** Small async delay — used to pace winner broadcast events for animation timing */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ──────────────────────────────────────────────
// executeDrawing
// ──────────────────────────────────────────────

/**
 * Executes the full drawing sequence for a room.
 *
 * Flow:
 * 1. Atomically transition state: active → drawing (optimistic lock via WHERE state='active')
 *    - If another process already started the drawing, this returns null (noop)
 * 2. Fetch all participants
 * 3. Handle zero participants: set state='finished', return early
 * 4. Select winners using Fisher-Yates + crypto.randomInt
 * 5. Insert winners into DB
 * 6. Update room to state='finished' with drawing metadata
 * 7. Broadcast realtime events: drawing_start → winner_selected (×N) → drawing_complete
 *
 * @param supabase  - MUST be the admin/service-role client
 * @param roomId    - UUID of the room to draw
 * @returns DrawingResult on success, null if drawing was already in progress (noop)
 *
 * @throws notFoundError if room doesn't exist
 * @throws forbiddenError if room is not in 'active' state
 * @throws internalError on DB or broadcast failure
 */
export async function executeDrawing(
  supabase: SupabaseDB,
  roomId: string
): Promise<DrawingResult | null> {
  const drawingStartedAt = new Date().toISOString();

  logger.info("[drawing.service] Starting drawing", { roomId });

  // ── Step 1: Atomically transition active → drawing ──────────────
  // The WHERE state='active' condition is the double-draw prevention lock.
  // If another cron invocation or force-draw already set state='drawing',
  // this UPDATE affects 0 rows and we return null (safe noop).
  const { data: room, error: lockError } = await supabase
    .from("rooms")
    .update({
      state: "drawing",
      drawing_started_at: drawingStartedAt,
    })
    .eq("id", roomId)
    .eq("state", "active") // ← optimistic lock
    .select()
    .single();

  if (lockError) {
    // PGRST116 = no rows matched (room was already drawing/finished or doesn't exist)
    if (lockError.code === "PGRST116") {
      logger.warn("[drawing.service] Drawing already in progress or room not found", { roomId });
      return null; // safe noop
    }
    logger.error("[drawing.service] Lock error", lockError, { roomId });
    throw internalError("Failed to start drawing.");
  }

  if (!room) {
    logger.warn("[drawing.service] No room returned after lock", { roomId });
    return null;
  }

  // ── Step 2: Fetch participants ──────────────────────────────────
  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("user_id, selected_number, users(email, username, avatar_url)")
    .eq("room_id", roomId);

  if (participantsError) {
    logger.error("[drawing.service] Failed to fetch participants", participantsError, { roomId });
    // Roll back to 'finished' so it doesn't stay stuck in 'drawing'
    await supabase
      .from("rooms")
      .update({ state: "finished", drawing_completed_at: new Date().toISOString(), drawing_participant_count: 0 })
      .eq("id", roomId);
    throw internalError("Failed to fetch participants for drawing.");
  }

  // ── Step 3: Handle zero participants ───────────────────────────
  if (!participants || participants.length === 0) {
    logger.info("[drawing.service] No participants — marking finished", { roomId });
    await supabase
      .from("rooms")
      .update({
        state: "finished",
        drawing_completed_at: new Date().toISOString(),
        drawing_participant_count: 0,
        drawing_algorithm: "crypto.randomInt",
      })
      .eq("id", roomId);

    // Refund Logic: Empty Room
    if (room.host_id) {
      const { data: host } = await supabase.from("users").select("credits").eq("id", room.host_id).single();
      if (host) {
        await (supabase.from("users") as any).update({ credits: host.credits + 10 }).eq("id", room.host_id);
        await (supabase.from("transactions") as any).insert({ user_id: room.host_id, amount: 10, description: "Refund: Empty Room" });
      }
    }

    await broadcastDrawingEvents(supabase, roomId, [], 0);

    return {
      roomId,
      winners: [],
      drawingStartedAt,
      drawingCompletedAt: new Date().toISOString(),
      participantCount: 0,
      algorithm: "crypto.randomInt",
    };
  }

  // ── Step 4: Select winners ─────────────────────────────────────
  const winnerCount = Math.min(room.total_winners, participants.length);
  const selected = selectWinners(participants, winnerCount);

  logger.info("[drawing.service] Winners selected", {
    roomId,
    participantCount: participants.length,
    winnerCount: selected.length,
  });

  // ── Step 5: Insert winners ──────────────────────────────────────
  const winnerRecords = selected.map(({ winner, sequence }) => {
    const userObj = (winner as any).users;
    const username = userObj?.username || userObj?.email?.split('@')[0] || "Lucky Winner";
    
    return {
      room_id: roomId,
      user_id: winner.user_id,
      selected_number: winner.selected_number,
      sequence,
      // Add user details for broadcast (not inserted into winners table directly)
      username,
      avatar_url: userObj?.avatar_url || null,
    };
  });

  const { error: winnersError } = await supabase
    .from("winners")
    .insert(
      winnerRecords.map(w => ({
        room_id: w.room_id,
        user_id: w.user_id,
        selected_number: w.selected_number,
        sequence: w.sequence
      }))
    );

  if (winnersError) {
    logger.error("[drawing.service] Failed to insert winners", winnersError, { roomId });
    // Attempt recovery: mark finished so room doesn't stay stuck in 'drawing'
    await supabase
      .from("rooms")
      .update({ state: "finished", drawing_completed_at: new Date().toISOString(), drawing_participant_count: participants.length })
      .eq("id", roomId);
    throw internalError("Failed to record drawing results.");
  }

  // Distribute Prize Pool
  const prizePerWinner = Math.floor(10 / winnerRecords.length);
  if (prizePerWinner > 0) {
    for (const w of winnerRecords) {
      const { data: wUser } = await supabase.from("users").select("credits").eq("id", w.user_id).single();
      if (wUser) {
        await (supabase.from("users") as any).update({ credits: wUser.credits + prizePerWinner }).eq("id", w.user_id);
        await (supabase.from("transactions") as any).insert({ user_id: w.user_id, amount: prizePerWinner, description: "Won Giveaway" });
      }
    }
  }

  // ── Step 6: Finalize room ───────────────────────────────────────
  const drawingCompletedAt = new Date().toISOString();

  const { error: finalizeError } = await supabase
    .from("rooms")
    .update({
      state: "finished",
      drawing_completed_at: drawingCompletedAt,
      drawing_participant_count: participants.length,
      drawing_algorithm: "crypto.randomInt",
    })
    .eq("id", roomId);

  if (finalizeError) {
    logger.error("[drawing.service] Failed to finalize room", finalizeError, { roomId });
    // Winners are already in DB — the room state is the only issue.
    // Log it but don't throw — the drawing succeeded, state is the only problem.
  }

  logger.info("[drawing.service] Drawing complete", {
    roomId,
    participantCount: participants.length,
    winnerCount: winnerRecords.length,
    drawingCompletedAt,
  });

  // ── Step 7: Broadcast realtime events ──────────────────────────
  // After DB is persisted — clients that miss events can fetch from DB.
  await broadcastDrawingEvents(supabase, roomId, winnerRecords, participants.length);

  const result: DrawingResult = {
    roomId,
    winners: winnerRecords.map((w) => ({
      userId: w.user_id,
      selectedNumber: w.selected_number,
      sequence: w.sequence,
    })),
    drawingStartedAt,
    drawingCompletedAt,
    participantCount: participants.length,
    algorithm: "crypto.randomInt",
  };

  return result;
}

// ──────────────────────────────────────────────
// broadcastDrawingEvents (internal)
// ──────────────────────────────────────────────

interface WinnerRecord {
  room_id: string;
  user_id: string;
  selected_number: number;
  sequence: number;
  username?: string;
  avatar_url?: string | null;
}

async function broadcastDrawingEvents(
  supabase: SupabaseDB,
  roomId: string,
  winners: WinnerRecord[],
  participantCount: number
): Promise<void> {
  const channel = supabase.channel(`room:${roomId}`);

  try {
    await channel.send({
      type: "broadcast",
      event: "room_state_change",
      payload: { roomId, newState: "drawing", timestamp: new Date().toISOString() },
    });

    await channel.send({
      type: "broadcast",
      event: "drawing_start",
      payload: { roomId },
    });

    for (const winner of winners) {
      await sleep(100); // pace between announcements for animation timing
      await channel.send({
        type: "broadcast",
        event: "winner_selected",
        payload: {
          roomId,
          sequence: winner.sequence,
          userId: winner.user_id,
          username: winner.username || "Unknown",
          avatarUrl: winner.avatar_url || null,
          selectedNumber: winner.selected_number,
        },
      });
    }

    await channel.send({
      type: "broadcast",
      event: "drawing_complete",
      payload: { roomId, totalWinners: winners.length },
    });

    await channel.send({
      type: "broadcast",
      event: "room_state_change",
      payload: { roomId, newState: "finished", timestamp: new Date().toISOString() },
    });
  } catch (err) {
    // Broadcast failures are non-fatal — DB is already updated.
    // Clients will fetch from DB on next page load.
    logger.warn("[drawing.service] Broadcast failed (non-fatal)", { roomId, error: String(err) });
  } finally {
    await supabase.removeChannel(channel);
  }
}

// ──────────────────────────────────────────────
// resolveExpiredRooms (Lazy Evaluation / Cron Fallback)
// ──────────────────────────────────────────────

/**
 * Sweeps the database for any 'active' rooms that have passed their deadline
 * and securely executes the drawing.
 * Used for Lazy Evaluation during high-traffic page renders to bypass Vercel cron limits.
 * 
 * @param supabaseAdmin - The admin/service-role client
 */
export async function resolveExpiredRooms(supabaseAdmin: SupabaseDB): Promise<void> {
  try {
    const { data: expiredRoomsRaw, error } = await supabaseAdmin
      .from("rooms")
      .select("id")
      .eq("state", "active")
      .lte("deadline", new Date().toISOString());

    if (error || !expiredRoomsRaw || expiredRoomsRaw.length === 0) {
      return;
    }

    const expiredRooms = expiredRoomsRaw as any[];

    // Process each room without blocking others
    await Promise.allSettled(
      expiredRooms.map(async (room) => {
        try {
          await executeDrawing(supabaseAdmin, room.id);
        } catch (e) {
          logger.error("[drawing.service] Failed to resolve expired room", e, { roomId: room.id });
        }
      })
    );
  } catch (err) {
    logger.error("[drawing.service] resolveExpiredRooms failed", err);
  }
}
