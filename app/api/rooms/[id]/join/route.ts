import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinRoom } from "@/lib/services/participants.service";
import { joinRoomSchema } from "@/lib/utils/validation";
import { joinRoomLimiter } from "@/lib/utils/rate-limit";
import {
  formatErrorResponse,
  unauthorizedError,
  validationError,
} from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Debounce store for participant count broadcasts
// key: roomId, value: timeout id reference (we use a simple approach)
const broadcastDebounce = new Map<string, ReturnType<typeof setTimeout>>();

// ──────────────────────────────────────────────
// POST /api/rooms/[id]/join
// Joins a room and selects a number.
// Rate limited: 5 per minute per user.
// ──────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    // Rate limiting: 5 joins per minute per user
    const limitResult = joinRoomLimiter.check(`joinRoom:${user.id}`);
    if (!limitResult.allowed) {
      logger.warn("[POST /api/rooms/[id]/join] Rate limit hit", { userId: user.id, roomId });
      return NextResponse.json(
        { error: { code: "RATE_LIMIT_EXCEEDED", message: "You're selecting numbers too quickly. Please slow down." } },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(limitResult.resetAt),
          },
        }
      );
    }

    // Parse + validate body
    const body = await request.json();
    const parsed = joinRoomSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError("Invalid request.", {
        selectedNumber: parsed.error.issues[0]?.message ?? "Invalid number",
      });
    }

    const participant = await joinRoom(
      supabase,
      roomId,
      user.id,
      parsed.data.selectedNumber
    );

    // Immediate participant count broadcast
    broadcastCount(supabase, roomId);

    logger.info("[POST /api/rooms/[id]/join] User joined", {
      roomId,
      userId: user.id,
      selectedNumber: parsed.data.selectedNumber,
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

/**
 * Broadcasts participant count instantly to all clients.
 */
async function broadcastCount(supabase: any, roomId: string) {
  try {
    const { count } = await supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    const channel = supabase.channel(`room:${roomId}`);
    await channel.send({
      type: "broadcast",
      event: "participant_count_update",
      payload: { roomId, count: count ?? 0 },
    });
    await supabase.removeChannel(channel);
  } catch {
    // Non-fatal — participant is already saved in DB
  }
}
