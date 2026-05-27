"use client";

import { useEffect, useRef } from "react";

type MessageHandler<T> = (data: T) => void;

interface UseMultiTabSyncOptions<T> {
  /**
   * Channel name — scoped per room to avoid cross-room interference.
   * Use a descriptive name like `room-state-${roomId}`.
   */
  channel: string;
  /** Called when another tab broadcasts a message on this channel. */
  onMessage: MessageHandler<T>;
}

interface UseMultiTabSyncReturn<T> {
  /** Broadcast a message to all other tabs on this channel. */
  broadcast: (data: T) => void;
}

/**
 * useMultiTabSync — cross-tab state synchronisation via the BroadcastChannel API.
 *
 * Used to avoid redundant Supabase Realtime connections when the same user
 * opens the same room in multiple tabs. One tab subscribes, others listen via
 * BroadcastChannel for state updates without opening additional WS connections.
 *
 * Falls back gracefully in environments that don't support BroadcastChannel
 * (e.g. SSR, old Safari). The `broadcast` function becomes a no-op.
 *
 * Notes:
 * - Self-messages are NOT delivered (BroadcastChannel does not echo to sender).
 * - JSON serialisation is used for all messages.
 */
export function useMultiTabSync<T>({
  channel: channelName,
  onMessage,
}: UseMultiTabSyncOptions<T>): UseMultiTabSyncReturn<T> {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref current
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    // BroadcastChannel is browser-only
    if (typeof BroadcastChannel === "undefined") return;

    const bc = new BroadcastChannel(channelName);
    channelRef.current = bc;

    bc.onmessage = (event: MessageEvent) => {
      try {
        const data = event.data as T;
        onMessageRef.current(data);
      } catch {
        // Ignore malformed messages from other tabs
      }
    };

    return () => {
      bc.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const broadcast = (data: T) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(data);
      } catch {
        // Ignore postMessage errors (e.g. channel closed)
      }
    }
  };

  return { broadcast };
}
