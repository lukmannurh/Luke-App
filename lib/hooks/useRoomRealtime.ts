"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomState } from "@/lib/types";

// ──────────────────────────────────────────────
// Event payload types (mirror drawing.service.ts broadcasts)
// ──────────────────────────────────────────────

export interface RoomStateChangePayload {
  roomId: string;
  newState: RoomState;
  timestamp: string;
}

export interface ParticipantCountUpdatePayload {
  roomId: string;
  count: number;
}

export interface DrawingStartPayload {
  roomId: string;
}

export interface WinnerSelectedPayload {
  roomId: string;
  sequence: number;
  userId: string;
  selectedNumber: number;
}

export interface DrawingCompletePayload {
  roomId: string;
  totalWinners: number;
}

export interface UseRoomRealtimeOptions {
  roomId: string;
  onStateChange?: (payload: RoomStateChangePayload) => void;
  onParticipantCountUpdate?: (payload: ParticipantCountUpdatePayload) => void;
  onDrawingStart?: (payload: DrawingStartPayload) => void;
  onWinnerSelected?: (payload: WinnerSelectedPayload) => void;
  onDrawingComplete?: (payload: DrawingCompletePayload) => void;
  /** Called when a new participant joins (postgres_changes INSERT) */
  onParticipantJoined?: () => void;
}

/**
 * useRoomRealtime — subscribes to all events on the `room:{id}` channel.
 *
 * Handles:
 * - Broadcast events: room_state_change, participant_count_update,
 *   drawing_start, winner_selected, drawing_complete
 * - Postgres changes: INSERT on participants table (live join notifications)
 *
 * Callbacks are stored in refs so they can be updated without re-subscribing.
 * The channel is created once and cleaned up on unmount.
 */
export function useRoomRealtime(options: UseRoomRealtimeOptions) {
  const {
    roomId,
    onStateChange,
    onParticipantCountUpdate,
    onDrawingStart,
    onWinnerSelected,
    onDrawingComplete,
    onParticipantJoined,
  } = options;

  // Store callbacks in refs so we can update them without re-subscribing
  const onStateChangeRef = useRef(onStateChange);
  const onParticipantCountUpdateRef = useRef(onParticipantCountUpdate);
  const onDrawingStartRef = useRef(onDrawingStart);
  const onWinnerSelectedRef = useRef(onWinnerSelected);
  const onDrawingCompleteRef = useRef(onDrawingComplete);
  const onParticipantJoinedRef = useRef(onParticipantJoined);

  // Sync refs with latest callbacks on every render
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
    onParticipantCountUpdateRef.current = onParticipantCountUpdate;
    onDrawingStartRef.current = onDrawingStart;
    onWinnerSelectedRef.current = onWinnerSelected;
    onDrawingCompleteRef.current = onDrawingComplete;
    onParticipantJoinedRef.current = onParticipantJoined;
  });

  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`room:${roomId}`)
      // ── Broadcast events ──────────────────────────────────────
      .on("broadcast", { event: "room_state_change" }, ({ payload }) => {
        onStateChangeRef.current?.(payload as RoomStateChangePayload);
      })
      .on("broadcast", { event: "participant_count_update" }, ({ payload }) => {
        onParticipantCountUpdateRef.current?.(payload as ParticipantCountUpdatePayload);
      })
      .on("broadcast", { event: "drawing_start" }, ({ payload }) => {
        onDrawingStartRef.current?.(payload as DrawingStartPayload);
      })
      .on("broadcast", { event: "winner_selected" }, ({ payload }) => {
        onWinnerSelectedRef.current?.(payload as WinnerSelectedPayload);
      })
      .on("broadcast", { event: "drawing_complete" }, ({ payload }) => {
        onDrawingCompleteRef.current?.(payload as DrawingCompletePayload);
      })
      // ── Postgres changes — participant inserts ────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          onParticipantJoinedRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]); // Only re-subscribe if roomId changes
}
