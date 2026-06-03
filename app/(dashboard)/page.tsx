import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Rocket, Gift, Moon, Sun } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolveExpiredRooms } from "@/lib/services/drawing.service";
import { Hero } from "@/components/landing/Hero";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";

export const metadata: Metadata = {
  title: "Giveaway App — Fair Draws. Zero Friction.",
  description:
    "Giveaway App is a mobile-first community giveaway app. Run transparent coin draws with smart credits, zero-wait automatic draws, and frictionless guest entry.",
};

export const dynamic = "force-dynamic";

/**
 * Root page — public landing page for guests, redirect to /rooms for auth users.
 * This is deliberately NOT protected by middleware so anyone can see it.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated users go straight to the room browser
  if (user) {
    redirect("/rooms");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal landing header removed to use global header */}

      <main className="flex-1">
        <Hero />
        <BentoFeatures />
      </main>

      {/* Sticky CTA bar */}
      <div className="sticky bottom-0 z-40 border-t-[3px] border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-md">
          <Link
            href="/rooms/create"
            id="landing-cta-btn"
            className="brutal-press flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-lg text-primary-foreground"
            aria-label="Create your giveaway"
          >
            <Rocket className="h-6 w-6" strokeWidth={2.5} />
            Create Your Giveaway Now
          </Link>
        </div>
      </div>
      <footer className="text-center py-4 text-sm font-medium">Created by lil owi</footer>
    </div>
  );
}
