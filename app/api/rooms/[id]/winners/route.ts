import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatErrorResponse, unauthorizedError, notFoundError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────
// GET /api/rooms/[id]/winners
// Returns the winner list for a finished room.
// ──────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    // Verify room exists and is finished
    const { data: roomRaw, error: roomError } = await supabase
      .from("rooms")
      .select("id, state, title, drawing_completed_at, drawing_participant_count, drawing_algorithm")
      .eq("id", roomId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const room = roomRaw as any;

    if (roomError || !room) {
      throw notFoundError("Room");
    }

    // Fetch winners with user info, ordered by sequence
    const { data: winners, error: winnersError } = await supabase
      .from("winners")
      .select(
        `
        id, room_id, user_id, selected_number, sequence, selected_at,
        user:users(id, username, avatar_url)
      `
      )
      .eq("room_id", roomId)
      .order("sequence", { ascending: true });

    if (winnersError) {
      logger.error("[GET /api/rooms/[id]/winners] DB error", winnersError, { roomId });
      throw new Error("Failed to load winners.");
    }

    const formattedWinners = (winners ?? []).map((w: any) => ({
      id: w.id,
      roomId: w.room_id,
      userId: w.user_id,
      selectedNumber: w.selected_number,
      sequence: w.sequence,
      selectedAt: w.selected_at,
      user: {
        id: w.user?.id ?? w.user_id,
        username: w.user?.username ?? "Unknown",
        avatarUrl: w.user?.avatar_url ?? null,
      },
    }));

    return NextResponse.json(
      {
        roomId,
        roomTitle: room.title,
        roomState: room.state,
        drawingCompletedAt: room.drawing_completed_at,
        participantCount: room.drawing_participant_count,
        algorithm: room.drawing_algorithm,
        winners: formattedWinners,
      },
      { status: 200 }
    );
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
