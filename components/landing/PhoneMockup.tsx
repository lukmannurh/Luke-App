import { Coins, Ticket, Trophy } from "lucide-react";

const numbers = ["07", "12", "23", "31", "44", "58"];

export function PhoneMockup() {
  return (
    <div className="brutal mx-auto w-[260px] rounded-[2.2rem] bg-white p-3">
      {/* notch */}
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-black/80" />

      <div
        className="overflow-hidden rounded-[1.5rem]"
        style={{ border: "3px solid var(--color-border)", background: "var(--color-background)" }}
      >
        {/* app top bar */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            borderBottom: "3px solid var(--color-border)",
            background: "var(--color-sky)",
            color: "var(--color-sky-foreground)",
          }}
        >
          <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Room #4821
          </span>
          <span
            className="brutal-press-sm flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
            style={{ background: "var(--color-coin)", color: "var(--color-coin-foreground)" }}
          >
            <Coins className="h-3.5 w-3.5" strokeWidth={2.5} /> Guest
          </span>
        </div>

        {/* prize pool */}
        <div
          className="px-3 py-3"
          style={{
            borderBottom: "3px solid var(--color-border)",
            background: "var(--color-coin)",
            color: "var(--color-coin-foreground)",
          }}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} /> Total Prize
          </div>
          <div className="text-2xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            12,500 🪙
          </div>
        </div>

        {/* number grid */}
        <div className="px-3 py-3">
          <div
            className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            <Ticket className="h-3.5 w-3.5" strokeWidth={2.5} /> Your Tickets
          </div>
          <div className="grid grid-cols-3 gap-2">
            {numbers.map((n, i) => (
              <div
                key={n}
                className="flex h-12 items-center justify-center rounded-lg text-lg font-bold"
                style={{
                  border: "3px solid var(--color-border)",
                  fontFamily: "var(--font-display)",
                  background:
                    i === 1
                      ? "var(--color-lime)"
                      : i === 4
                      ? "var(--color-pink)"
                      : "white",
                  color: "var(--color-foreground)",
                }}
              >
                {n}
              </div>
            ))}
          </div>

          <div
            className="mt-3 flex h-11 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              border: "3px solid var(--color-border)",
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              fontFamily: "var(--font-display)",
            }}
          >
            Draw in 00:42
          </div>
        </div>
      </div>
    </div>
  );
}
