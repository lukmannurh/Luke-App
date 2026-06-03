import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Room — Giveaway App",
  description: "Create a new giveaway room. Set the number range, deadline, and number of winners.",
};

export const dynamic = "force-dynamic";

/**
 * Create Room page — Lovable UI + existing CreateRoomForm backend logic preserved.
 */
export default async function CreateRoomPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .single();

  const credits = (profileData as any)?.credits ?? 0;
  const cost = 10;
  const canPay = credits >= cost;

  return (
    <>
      <Link
        href="/rooms"
        className="inline-flex items-center gap-1 font-display text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Browse
      </Link>

      <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight">🎁 Create a Room</h1>
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        Set up your giveaway. Players pick a lucky number before the deadline.
      </p>

      {/* Cost badge */}
      <div className="brutal mt-5 flex items-center justify-between rounded-xl bg-coin p-4 text-coin-foreground">
        <span className="font-bold">Creation cost</span>
        <span className="font-display text-xl">-{cost} 🪙</span>
      </div>

      {/* Insufficient credits warning */}
      {!canPay && (
        <div className="brutal mt-4 rounded-xl bg-pink p-4 text-center text-pink-foreground">
          <p className="font-display">Insufficient credits</p>
          <p className="mt-1 text-sm font-medium">
            You need {cost} credits. You have {credits}.
          </p>
        </div>
      )}

      {/* Form */}
      <div className="brutal mt-5 rounded-2xl bg-card p-5 text-card-foreground">
        <CreateRoomForm />
      </div>
    </>
  );
}
