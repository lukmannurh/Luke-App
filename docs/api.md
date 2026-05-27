# API Documentation

The Community Giveaway Platform exposes the following core endpoints to handle room creation, joining, and drawing mechanics. All requests and responses use JSON format.

## `POST /api/rooms`
Creates a new giveaway room.

**Authentication:** Required (User must be logged in via Supabase)

**Request Body:**
```json
{
  "title": "Summer Giveaway 2025",
  "description": "Win a brand new console!",
  "minNumber": 1,
  "maxNumber": 100,
  "duration": 60,
  "totalWinners": 1
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-v4",
  "title": "Summer Giveaway 2025",
  "description": "Win a brand new console!",
  "min_number": 1,
  "max_number": 100,
  "deadline": "2026-05-27T12:00:00Z",
  "total_winners": 1,
  "state": "active",
  "host_id": "user-uuid"
}
```

---

## `POST /api/rooms/[id]/join`
Allows an authenticated user to select a number and join an active room.

**Authentication:** Required

**Request Body:**
```json
{
  "selectedNumber": 42
}
```

**Response (200 OK):**
```json
{
  "id": "participant-uuid",
  "room_id": "room-uuid",
  "user_id": "user-uuid",
  "selected_number": 42,
  "joined_at": "2026-05-27T10:00:00Z"
}
```

**Common Errors:**
- `409 Conflict`: The number is already taken, or the user has already joined the room.
- `400 Bad Request`: The selected number is outside the room's allowed range.
- `403 Forbidden`: The room is no longer active.

---

## `POST /api/rooms/[id]/draw`
(Internal) Endpoint executed automatically to process the drawing when the deadline expires.

**Authentication:** Required via Header (`Authorization: Bearer <CRON_SECRET>`)

**Request Body:** None

**Response (200 OK):**
```json
{
  "roomId": "room-uuid",
  "winners": [
    {
      "userId": "user-uuid",
      "selectedNumber": 42,
      "sequence": 1
    }
  ],
  "drawingStartedAt": "2026-05-27T12:00:00.000Z",
  "drawingCompletedAt": "2026-05-27T12:00:01.000Z",
  "participantCount": 50,
  "algorithm": "crypto.randomInt"
}
```

---

## `POST /api/rooms/[id]/force-draw`
Allows the host of the room to immediately trigger the drawing, regardless of whether the deadline has passed.

**Authentication:** Required (User must be the `host_id` of the room)

**Request Body:** None

**Response (200 OK):**
```json
{
  "roomId": "room-uuid",
  "winners": [
    {
      "userId": "user-uuid",
      "selectedNumber": 42,
      "sequence": 1
    }
  ],
  "drawingStartedAt": "2026-05-27T11:45:00.000Z",
  "drawingCompletedAt": "2026-05-27T11:45:01.000Z",
  "participantCount": 50,
  "algorithm": "crypto.randomInt"
}
```
