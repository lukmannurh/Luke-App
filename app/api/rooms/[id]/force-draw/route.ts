import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { executeDrawing } from "@/lib/services/drawing.service";
import {
  formatErrorResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
} from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────
// POST /api/rooms/[id]/force-draw
// Allows the room host to manually trigger the drawing at ANY TIME
// while the room is active. No grace period required.
// Requirements:
//   1. Authenticated user must be the room host
//   2. Room must be in 'active' state
// Uses the Supabase admin client (service role) to bypass RLS.
// ──────────────────────────────────────────────
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;

    // ── Authentication ─────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    // ── Fetch room and verify host ownership ───────────────────
    const { data: roomRaw, error: roomError } = await supabase
      .from("rooms")
      .select("id, host_id, state, deadline")
      .eq("id", roomId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const room = roomRaw as any;

    if (roomError || !room) {
      if (roomError?.code === "PGRST116") throw notFoundError("Room");
      throw notFoundError("Room");
    }

    if (room.host_id !== user.id) {
      throw forbiddenError(
        "Only the room host can trigger a manual drawing."
      );
    }

    // ── Verify room is still active ────────────────────────────
    if (room.state !== "active") {
      throw forbiddenError(
        room.state === "drawing"
          ? "The drawing is already in progress."
          : "The drawing for this room has already been completed."
      );
    }

    // ── Execute drawing with admin client ───────────────────────
    logger.info("[POST /api/rooms/[id]/force-draw] Host triggering drawing", {
      roomId,
      userId: user.id,
    });

    const supabaseAdmin = createAdminClient();
    const result = await executeDrawing(supabaseAdmin, roomId);

    if (result === null) {
      return NextResponse.json(
        { message: "Drawing was already started by another process. Please refresh to see results." },
        { status: 200 }
      );
    }

    logger.info("[POST /api/rooms/[id]/force-draw] Force draw completed", {
      roomId,
      userId: user.id,
      winnerCount: result.winners.length,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
