import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getParticipants,
  getAvailableNumbers,
} from "@/lib/services/participants.service";
import { getRoomById } from "@/lib/services/rooms.service";
import { formatErrorResponse, unauthorizedError } from "@/lib/utils/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ──────────────────────────────────────────────
// GET /api/rooms/[id]/participants
// Returns participant list + available numbers for number selection UI.
// ──────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roomId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    // Fetch room (for min/max range) and participants in parallel
    const [room, participants] = await Promise.all([
      getRoomById(supabase, roomId),
      getParticipants(supabase, roomId),
    ]);

    const numberData = await getAvailableNumbers(
      supabase,
      roomId,
      room.min_number,
      room.max_number
    );

    return NextResponse.json(
      {
        participants,
        ...numberData,
      },
      { status: 200 }
    );
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
