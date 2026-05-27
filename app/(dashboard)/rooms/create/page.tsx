import type { Metadata } from "next";
import Link from "next/link";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";

export const metadata: Metadata = {
  title: "Create Room — Giveaway App",
  description: "Create a new giveaway room. Set the number range, deadline, and number of winners.",
};

/**
 * Create Room page — Server Component (form is a Client Component).
 */
export default function CreateRoomPage() {
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
        <CreateRoomForm />
      </div>
    </div>
  );
}
