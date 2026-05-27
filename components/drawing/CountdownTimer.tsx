"use client";

import { useState, useEffect, useRef } from "react";
import { calculateTimeLeft, formatCountdown } from "@/lib/utils/date";
import type { TimeLeft } from "@/lib/types";

interface CountdownTimerProps {
  /** ISO 8601 UTC timestamp */
  deadline: string;
  /** Called once when the countdown reaches zero */
  onExpire?: () => void;
  /** Show full breakdown (days/hours/min/sec) or compact format */
  variant?: "full" | "compact";
}

/**
 * CountdownTimer — Client Component.
 * Calculates time remaining client-side every second.
 * Uses isMounted guard to prevent hydration mismatches.
 * Visual urgency: warning (orange) at < 5 min, urgent (red) at < 1 min.
 */
export function CountdownTimer({
  deadline,
  onExpire,
  variant = "compact",
}: CountdownTimerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(deadline));
  const expiredRef = useRef(false);

  // Mount guard — only render dynamic content after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Recalculate immediately on mount
    setTimeLeft(calculateTimeLeft(deadline));
    expiredRef.current = false;

    const tick = () => {
      const tl = calculateTimeLeft(deadline);
      setTimeLeft(tl);

      if (tl.isExpired && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire, isMounted]);

  // Before mount: show a static placeholder to avoid hydration mismatch
  if (!isMounted) {
    return (
      <span
        className="font-black tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
        aria-label="Loading countdown"
      >
        --:--:--
      </span>
    );
  }

  const urgencyClass =
    timeLeft.isExpired || timeLeft.total < 60_000
      ? "timer-urgent"
      : timeLeft.total < 5 * 60_000
      ? "timer-warning"
      : "";

  if (timeLeft.isExpired) {
    return (
      <span
        className={`font-black font-display ${urgencyClass}`}
        style={{ fontFamily: "var(--font-display)" }}
        aria-live="polite"
        aria-label="Deadline passed"
      >
        Ended
      </span>
    );
  }

  if (variant === "full") {
    return (
      <div
        className={`flex gap-2 items-end ${urgencyClass}`}
        aria-live="polite"
        aria-label={`Time remaining: ${formatCountdown(timeLeft)}`}
      >
        {timeLeft.days > 0 && (
          <TimeUnit value={timeLeft.days} label="d" />
        )}
        <TimeUnit value={timeLeft.hours} label="h" />
        <TimeUnit value={timeLeft.minutes} label="m" />
        <TimeUnit value={timeLeft.seconds} label="s" />
      </div>
    );
  }

  return (
    <span
      className={`font-black tabular-nums ${urgencyClass}`}
      style={{ fontFamily: "var(--font-display)" }}
      aria-live="polite"
      aria-label={`Time remaining: ${formatCountdown(timeLeft)}`}
    >
      {formatCountdown(timeLeft)}
    </span>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-2xl font-black tabular-nums"
        style={{ fontFamily: "var(--font-display)", minWidth: "2ch", textAlign: "center" }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs font-bold" style={{ color: "var(--color-muted-foreground)" }}>
        {label}
      </span>
    </div>
  );
}
