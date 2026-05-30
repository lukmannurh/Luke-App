import type { Metadata } from "next";
import Link from "next/link";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Room — Giveaway App",
  description: "Create a new giveaway room. Set the number range, deadline, and number of winners.",
};

/**
 * Create Room page — Server Component (form is a Client Component).
 */
export default async function CreateRoomPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("users")
    .select("credits")
    .eq("id", user.id)
    .single();

  const profile = profileData as any;

  const credits = profile?.credits ?? 0;
  
  return (
    <div className="max-w-lg mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm font-medium">
          <li>
            <Link
              href="/"
              className="underline underline-offset-2"
              style={{ color: "var(--color-primary)" }}
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--color-muted-foreground)" }}>›</li>
          <li aria-current="page" style={{ color: "var(--color-muted-foreground)" }}>
            Create Room
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-black"
          style={{ fontFamily: "var(--font-display)" }}
        >
          🎁 Create a Room
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Set up your giveaway room. Participants will pick a lucky number before the deadline.
        </p>
      </div>

      {/* Form */}
      <div className="neo-card p-6">
        {credits < 10 ? (
          <div className="bg-orange-100 border-2 border-orange-500 p-4 text-center">
            <p className="font-bold text-orange-800">Insufficient Credits</p>
            <p className="text-sm mt-1">You need at least 10 credits to create a room. You currently have {credits} credits.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 border-2 border-[var(--color-border)] bg-[var(--color-muted)] flex justify-between items-center">
              <span className="font-bold">Creation Cost:</span>
              <span className="font-black text-xl text-red-600">-10 Credits</span>
            </div>
            <CreateRoomForm />
          </>
        )}
      </div>
    </div>
  );
}
