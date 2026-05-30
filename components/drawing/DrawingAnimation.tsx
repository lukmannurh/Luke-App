"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WinnerReveal {
  sequence: number;
  userId: string;
  username: string;
  selectedNumber: number;
}

interface DrawingAnimationProps {
  roomId: string;
  totalWinners: number;
  participantCount: number;
  onComplete?: () => void;
}

const randomDigit = () => Math.floor(Math.random() * 10);

export function DrawingAnimation({
  roomId,
  totalWinners,
  participantCount,
  onComplete,
}: DrawingAnimationProps) {
  const router = useRouter();
  
  // State machine: "awaiting_winners" -> "spinning" -> "paused" -> "done"
  const [phase, setPhase] = useState<"awaiting_winners" | "spinning" | "paused" | "done">("awaiting_winners");
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [displayDigits, setDisplayDigits] = useState<[number | string, number | string, number | string]>(['-', '-', '-']);
  const [winners, setWinners] = useState<WinnerReveal[]>([]);
  const pendingWinnersRef = useRef<WinnerReveal[]>([]);

  // Realtime subscription for winners
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on("broadcast", { event: "winner_selected" }, ({ payload }) => {
        const newWinner = {
          sequence: payload.sequence,
          userId: payload.userId,
          username: payload.username || "Unknown User",
          selectedNumber: payload.selectedNumber,
        };
        pendingWinnersRef.current.push(newWinner);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Hybrid animation logic (Async Sequence)
  const animationStartedRef = useRef(false);

  useEffect(() => {
    if (animationStartedRef.current) return;
    animationStartedRef.current = true;

    let isCancelled = false;

    const ensureWinners = async () => {
      let finalWinners = [...pendingWinnersRef.current];
      const expectedWinners = Math.min(totalWinners, participantCount);
      
      if (finalWinners.length < expectedWinners && participantCount > 0) {
        try {
          const res = await fetch(`/api/rooms/${roomId}/winners`);
          if (res.ok) {
            const data = await res.json();
            finalWinners = data.winners.map((w: any) => ({
              sequence: w.sequence,
              userId: w.userId,
              username: w.user?.username || "Unknown User",
              selectedNumber: w.selectedNumber,
            }));
            pendingWinnersRef.current = finalWinners;
          }
        } catch (err) {}
      }
      return finalWinners;
    };

    const runAnimation = async () => {
      await new Promise(r => setTimeout(r, 500));
      if (isCancelled) return;
      
      const w = await ensureWinners();
      const sortedWinners = w.sort((a, b) => a.sequence - b.sequence);
      
      if (totalWinners > 5) {
        setPhase("spinning");
        const spinEnd = Date.now() + 3000;
        while (Date.now() < spinEnd) {
          if (isCancelled) return;
          setDisplayDigits([randomDigit(), randomDigit(), randomDigit()]);
          await new Promise(r => setTimeout(r, 50));
        }
        if (isCancelled) return;
        setWinners(sortedWinners);
        setPhase("done");
        if (onComplete) onComplete();
        router.refresh();
      } else {
        for (let i = 0; i < sortedWinners.length; i++) {
          if (isCancelled) return;
          
          setCurrentWinnerIndex(i);
          setPhase("spinning");
          
          const spinEnd = Date.now() + 2500;
          while (Date.now() < spinEnd) {
            if (isCancelled) return;
            setDisplayDigits([randomDigit(), randomDigit(), randomDigit()]);
            await new Promise(r => setTimeout(r, 50));
          }
          
          if (isCancelled) return;
          const targetWinner = sortedWinners[i];
          if (targetWinner) {
            const str = String(targetWinner.selectedNumber);
            const padded = str.padStart(3, ' ');
            setDisplayDigits([padded[0], padded[1], padded[2]]);
          } else {
            setDisplayDigits(['-', '-', '-']);
          }
          
          setPhase("paused");
          await new Promise(r => setTimeout(r, 1500));
        }
        
        if (isCancelled) return;
        setWinners(sortedWinners);
        setPhase("done");
        if (onComplete) onComplete();
        router.refresh();
      }
    };

    runAnimation();

    return () => {
      isCancelled = true;
      animationStartedRef.current = false;
    };
  }, [roomId, totalWinners, participantCount, router, onComplete]);

  if (phase === "done") {
    return (
      <div className="neo-card p-10 text-center" style={{ background: "#eff6ff", boxShadow: "var(--shadow-neo-primary)" }}>
        <div className="text-6xl mb-4" aria-hidden="true">🏆</div>
        <h2 className="text-3xl font-black mb-6" style={{ fontFamily: "var(--font-display)" }}>
          {winners.length > 1 ? "WINNERS REVEALED!" : "WINNER REVEALED!"}
        </h2>
        {winners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {winners.sort((a, b) => a.sequence - b.sequence).map((w) => (
              <div key={w.sequence} className="flex flex-col items-center justify-center p-6 bg-white border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_var(--color-border)]">
                <span className="neo-badge neo-badge-accent mb-2 text-sm">Winner #{w.sequence}</span>
                <span className="font-black text-5xl my-2 text-[var(--color-primary)]">{w.selectedNumber}</span>
                <span className="font-bold text-lg text-[var(--color-muted-foreground)] uppercase truncate w-full">{w.username}</span>
              </div>
            ))}
          </div>
        ) : participantCount > 0 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-white border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_var(--color-border)]">
            <span className="font-bold text-xl text-[var(--color-muted-foreground)] uppercase animate-pulse">Waiting for network...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-white border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_var(--color-border)]">
            <span className="font-bold text-xl text-[var(--color-muted-foreground)] uppercase">No participants</span>
          </div>
        )}
      </div>
    );
  }

  const DigitColumn = ({ digit }: { digit: string | number }) => (
    <div 
      className="flex flex-col items-center justify-center w-20 h-28 sm:w-24 sm:h-32 bg-white border-[4px] border-[var(--color-border)] overflow-hidden"
      style={{ boxShadow: "4px 4px 0px var(--color-border)" }}
    >
      <span className="text-6xl sm:text-7xl font-black tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
        {digit}
      </span>
    </div>
  );

  return (
    <div className="neo-card p-6 sm:p-10 text-center">
      <div className="neo-badge neo-badge-drawing inline-flex mb-6">
        🎰 Drawing... {totalWinners <= 5 ? `Revealing Winner ${currentWinnerIndex + 1} of ${totalWinners}` : "Rapid Spin!"}
      </div>

      <div className="flex justify-center gap-3 sm:gap-6 my-8" aria-live="polite">
        <DigitColumn digit={displayDigits[0]} />
        <DigitColumn digit={displayDigits[1]} />
        <DigitColumn digit={displayDigits[2]} />
      </div>

      <p
        className="text-2xl font-black mb-4 animate-pulse"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-warning)" }}
      >
        {phase === "paused" ? "🎉 LOCKED! 🎉" : "🥁 Drumroll..."}
      </p>

      <p className="text-sm mt-6 font-bold" style={{ color: "var(--color-muted-foreground)" }}>
        👥 {participantCount} participants · 🏆 {totalWinners} winner{totalWinners !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
