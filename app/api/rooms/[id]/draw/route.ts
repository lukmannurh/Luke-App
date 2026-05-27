import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { executeDrawing } from "@/lib/services/drawing.service";
import { formatErrorResponse } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────
// POST /api/rooms/[id]/draw
// Triggers the drawing for a room.
// Authentication: CRON_SECRET bearer token (NOT user auth).
// Called by the cron job at /api/cron/check-deadlines.
// Uses the Supabase admin client (service role) to bypass RLS.
// ──────────────────────────────────────────────
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;

    // ── CRON_SECRET verification ────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      logger.error("[POST /api/rooms/[id]/draw] CRON_SECRET not configured");
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Server configuration error." } },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      logger.warn("[POST /api/rooms/[id]/draw] Unauthorized draw attempt", { roomId });
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid or missing authorization." } },
        { status: 401 }
      );
    }

    // ── Execute drawing with admin client ───────────────────────
    // Admin client bypasses RLS — required to UPDATE rooms and INSERT winners.
    const supabaseAdmin = createAdminClient();
    const result = await executeDrawing(supabaseAdmin, roomId);

    if (result === null) {
      // Drawing already in progress or finished (safe noop)
      logger.info("[POST /api/rooms/[id]/draw] Drawing already in progress or finished", { roomId });
      return NextResponse.json(
        { message: "Drawing already processed for this room." },
        { status: 200 }
      );
    }

    logger.info("[POST /api/rooms/[id]/draw] Drawing completed", {
      roomId,
      winnerCount: result.winners.length,
      participantCount: result.participantCount,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
