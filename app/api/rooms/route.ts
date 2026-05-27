import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRooms, createRoom } from "@/lib/services/rooms.service";
import { createRoomLimiter } from "@/lib/utils/rate-limit";
import { formatErrorResponse, unauthorizedError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

// ──────────────────────────────────────────────
// GET /api/rooms
// Returns a paginated, optionally filtered list of rooms.
// Query params: ?state=active|drawing|finished&page=1&limit=20
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = request.nextUrl;
    const options = {
      state: searchParams.get("state") as "active" | "drawing" | "finished" | undefined,
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
    };

    const result = await getRooms(supabase, options);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

// ──────────────────────────────────────────────
// POST /api/rooms
// Creates a new giveaway room.
// Rate limited: 10 per hour per user.
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw unauthorizedError();

    // Rate limiting
    const limitResult = createRoomLimiter.check(`createRoom:${user.id}`);
    if (!limitResult.allowed) {
      logger.warn("[POST /api/rooms] Rate limit hit", { userId: user.id });
      const { body, status } = formatErrorResponse(
        Object.assign(new Error("You've created too many rooms recently. Try again later."), {
          code: "RATE_LIMIT_EXCEEDED",
          statusCode: 429,
          name: "AppError",
        })
      );
      // Manually build the rate-limit error since we need the AppError factory
      return NextResponse.json(
        { error: { code: "RATE_LIMIT_EXCEEDED", message: "You've created too many rooms recently. Try again later." } },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(limitResult.remaining),
            "X-RateLimit-Reset": String(limitResult.resetAt),
          },
        }
      );
    }

    const body = await request.json();
    const room = await createRoom(supabase, user.id, body);

    logger.info("[POST /api/rooms] Room created", { roomId: room.id, userId: user.id });
    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    const { body, status } = formatErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
