import { Coins, Ticket, Trophy } from "lucide-react";

const numbers = ["07", "12", "23", "31", "44", "58"];

export function PhoneMockup() {
  return (
    <div className="brutal mx-auto w-[260px] rounded-[2.2rem] bg-card p-3">
      {/* notch */}
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-foreground/80" />

      <div className="overflow-hidden rounded-[1.5rem] border-[3px] border-border bg-background">
        {/* app top bar */}
        <div className="flex items-center justify-between border-b-[3px] border-border bg-sky px-3 py-2 text-sky-foreground">
          <span className="font-display text-sm">Room #4821</span>
          <span className="brutal-press-sm flex items-center gap-1 rounded-lg bg-coin px-2 py-1 text-xs font-bold text-coin-foreground">
            <Coins className="h-3.5 w-3.5" strokeWidth={2.5} /> Guest
          </span>
        </div>

        {/* prize pool */}
        <div className="border-b-[3px] border-border bg-coin px-3 py-3 text-coin-foreground">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} /> Total Prize
          </div>
          <div className="font-display text-2xl leading-tight">12,500 🪙</div>
        </div>

        {/* number grid */}
        <div className="px-3 py-3">
          <div className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <Ticket className="h-3.5 w-3.5" strokeWidth={2.5} /> Your Tickets
          </div>
          <div className="grid grid-cols-3 gap-2">
            {numbers.map((n, i) => (
              <div
                key={n}
                className={`flex h-12 items-center justify-center rounded-lg border-[3px] border-border font-display text-lg ${
                  i === 1 ? "bg-lime text-lime-foreground" : i === 4 ? "bg-pink text-pink-foreground" : "bg-card text-card-foreground"
                }`}
              >
                {n}
              </div>
            ))}
          </div>

          <div className="mt-3 flex h-11 items-center justify-center rounded-xl border-[3px] border-border bg-primary font-display text-sm text-primary-foreground">
            Draw in 00:42
          </div>
        </div>
      </div>
    </div>
  );
}
