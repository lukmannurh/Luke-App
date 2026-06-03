import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

export function Hero() {
  return (
    <section className="mx-auto max-w-md px-4 pb-6 pt-8">
      <span className="brutal inline-flex rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-wide text-pink-foreground">
        Community Giveaway · PWA
      </span>

      <h1 className="mt-4 font-display text-[2.9rem] leading-[0.92] tracking-tight">
        Fair Draws.
        <br />
        <span className="ml-6 inline-block bg-lime px-2 text-lime-foreground">Zero</span>
        <br />
        <span className="ml-2 inline-block -rotate-2 bg-sky px-2 text-sky-foreground">Friction.</span>
      </h1>

      <p className="mt-5 text-base font-medium leading-snug text-muted-foreground">
        Spin up transparent coin giveaways with your community — right from your phone.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/rooms"
          id="hero-open-app"
          className="brutal-press flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground"
        >
          <ExternalLink className="h-6 w-6" strokeWidth={2.5} />
          Open Web App
        </Link>
        <Link
          href="/login"
          id="hero-signin"
          className="brutal-press flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-card font-display text-lg text-card-foreground"
        >
          <Download className="h-6 w-6" strokeWidth={2.5} />
          Sign In / Guest
        </Link>
      </div>

      <div className="mt-10">
        <PhoneMockup />
      </div>
    </section>
  );
}
