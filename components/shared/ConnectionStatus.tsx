"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type ConnectionState = "connected" | "reconnecting" | "disconnected";

interface ConnectionStatusProps {
  roomId: string;
}

/**
 * ConnectionStatus — Client Component.
 * Shows 🟢/🟡/🔴 for the Supabase Realtime connection state on a room channel.
 */
export function ConnectionStatus({ roomId }: ConnectionStatusProps) {
  const [state, setState] = useState<ConnectionState>("reconnecting");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`connection-status:${roomId}`)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setState("connected");
        else if (status === "CHANNEL_ERROR" || status === "CLOSED") setState("disconnected");
        else setState("reconnecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const config: Record<ConnectionState, { dot: string; label: string; emoji: string }> = {
    connected: { dot: "connection-dot-connected", label: "Connected", emoji: "🟢" },
    reconnecting: { dot: "connection-dot-reconnecting", label: "Reconnecting", emoji: "🟡" },
    disconnected: { dot: "connection-dot-disconnected", label: "Disconnected", emoji: "🔴" },
  };

  const { dot, label, emoji } = config[state];

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 border border-[var(--color-border)]"
      role="status"
      aria-label={`Realtime: ${label}`}
      title={`Realtime: ${label}`}
    >
      <span className={`connection-dot ${dot}`} aria-hidden="true" />
      <span className="text-xs font-bold hidden sm:inline" style={{ color: "var(--color-muted-foreground)" }}>
        {label}
      </span>
      <span className="sm:hidden" aria-hidden="true">{emoji}</span>
    </div>
  );
}
