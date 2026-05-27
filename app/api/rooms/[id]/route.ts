import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoomById, deleteRoom } from "@/lib/services/rooms.service";
import { formatErrorResponse, unauthorizedError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────
// GET /api/rooms/[id]
// Returns full room detail with host, participants, and winners.
// ──────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    const room = await getRoomById(supabase, id);
    return NextResponse.json(room, { status: 200 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

// ──────────────────────────────────────────────
// DELETE /api/rooms/[id]
// Deletes an active room. Only the host can do this.
// ──────────────────────────────────────────────
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    await deleteRoom(supabase, id, user.id);

    logger.info("[DELETE /api/rooms/[id]] Room deleted", { roomId: id, userId: user.id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
