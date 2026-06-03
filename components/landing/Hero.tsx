import Link from "next/link";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { ExternalLink, Download } from "lucide-react";

interface HeroProps {
  isLoggedIn: boolean;
}

export function Hero({ isLoggedIn }: HeroProps) {
  return (
    <section className="mx-auto max-w-md px-4 pb-6 pt-8">
      <span
        className="brutal inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
        style={{ background: "var(--color-pink)", color: "var(--color-pink-foreground)" }}
      >
        Community Giveaway · PWA
      </span>

      <h1
        className="mt-4 text-[2.9rem] leading-[0.92] tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Fair Draws.
        <br />
        <span
          className="ml-6 inline-block px-2"
          style={{ background: "var(--color-lime)", color: "var(--color-lime-foreground)" }}
        >
          Zero
        </span>
        <br />
        <span
          className="ml-2 inline-block -rotate-2 px-2"
          style={{ background: "var(--color-sky)", color: "var(--color-sky-foreground)" }}
        >
          Friction.
        </span>
      </h1>

      <p className="mt-5 text-base font-medium leading-snug" style={{ color: "var(--color-muted-foreground)" }}>
        Spin up transparent coin giveaways with your community — right from your phone.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/rooms"
          id="hero-open-app-btn"
          className="brutal-press flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
            fontFamily: "var(--font-display)",
          }}
        >
          <ExternalLink className="h-6 w-6" strokeWidth={2.5} />
          Open Web App
        </Link>
        <Link
          href={isLoggedIn ? "/" : "/login"}
          id="hero-signin-btn"
          className="brutal-press flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg"
          style={{
            background: "white",
            color: "var(--color-foreground)",
            fontFamily: "var(--font-display)",
          }}
        >
          <Download className="h-6 w-6" strokeWidth={2.5} />
          {isLoggedIn ? "Go to Dashboard" : "Sign In / Guest"}
        </Link>
      </div>

      <div className="mt-10">
        <PhoneMockup />
      </div>
    </section>
  );
}
