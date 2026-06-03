import { Coins, Timer, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  emoji: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  bg: string;
  fg: string;
};

const features: Feature[] = [
  {
    emoji: "🪙",
    icon: Coins,
    title: "Smart Credits",
    desc: "A seamless virtual coin system. Top up once, join any room instantly.",
    bg: "bg-[var(--color-coin)]",
    fg: "text-[var(--color-coin-foreground)]",
  },
  {
    emoji: "🤖",
    icon: Timer,
    title: "Zero-Wait Draws",
    desc: "Automatic, on-time draws powered by a Lazy Evaluation System. No host needed.",
    bg: "bg-[var(--color-sky)]",
    fg: "text-[var(--color-sky-foreground)]",
  },
  {
    emoji: "⚡",
    icon: Zap,
    title: "Frictionless Entry",
    desc: "Hop into any room as a Guest in under one second. No signup walls.",
    bg: "bg-[var(--color-pink)]",
    fg: "text-[var(--color-pink-foreground)]",
  },
];

export function BentoFeatures() {
  return (
    <section className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-5 text-3xl leading-none" style={{ fontFamily: "var(--font-display)" }}>
        Built for
        <br />
        <span className="bg-[var(--color-lime)] px-2 text-[var(--color-lime-foreground)]">your thumb.</span>
      </h2>

      <div className="flex flex-col gap-4">
        {features.map((f) => (
          <article
            key={f.title}
            className={`brutal-press flex min-h-[48px] items-start gap-4 rounded-2xl ${f.bg} ${f.fg} p-4`}
          >
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-xl border-[3px] border-[var(--color-border)] bg-white text-3xl">
              {f.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <f.icon className="h-5 w-5" strokeWidth={2.5} />
                <h3 className="text-xl leading-none" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
