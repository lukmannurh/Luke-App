"use client";

import { useState, useEffect, useRef } from "react";
import { calculateTimeLeft } from "@/lib/utils/date";
import type { TimeLeft } from "@/lib/types";

interface UseCountdownOptions {
  deadline: string;
  /** Called once when the countdown first reaches zero */
  onExpire?: () => void;
}

/**
 * useCountdown — client-side countdown that ticks every second.
 *
 * Returns a TimeLeft object with { days, hours, minutes, seconds, total, isExpired }.
 * The `onExpire` callback fires exactly once when the timer first expires.
 *
 * Uses a ref to avoid re-subscribing when `onExpire` identity changes.
 */
export function useCountdown({ deadline, onExpire }: UseCountdownOptions): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(deadline));
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep ref current without causing re-subscribe
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    // Reset on deadline change
    hasExpiredRef.current = false;
    setTimeLeft(calculateTimeLeft(deadline));

    const interval = setInterval(() => {
      const tl = calculateTimeLeft(deadline);
      setTimeLeft(tl);

      if (tl.isExpired && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return timeLeft;
}
