"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GuestOnboardingModal({
  isGuest,
  username,
}: {
  isGuest: boolean;
  username: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  
  // Needs a new username if it's a guest AND username is missing, or contains "guest" or "anonymous"
  const needsUsername =
    isGuest &&
    (!username ||
      username.toLowerCase().includes("guest") ||
      username.toLowerCase().includes("anonymous"));

  const [isOpen, setIsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    if (needsUsername && !sessionStorage.getItem("guest_onboarded")) {
      setIsOpen(true);
    }
  }, [needsUsername]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");



  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (newUsername.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated.");
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await (supabase as any)
      .from("users")
      .update({ username: newUsername.trim() })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.code === "23505") {
        setError("Username already taken. Please choose another.");
      } else {
        setError(updateError.message);
      }
      setIsLoading(false);
      return;
    }

    sessionStorage.setItem("guest_onboarded", "true");
    setIsOpen(false);
    router.refresh();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4">
      <div className="brutal w-full max-w-sm bg-accent p-6 text-accent-foreground rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-rise">
        <h2 className="font-display text-2xl mb-2 leading-tight">Welcome, Guest! 👋</h2>
        <p className="text-sm font-medium mb-6">
          Before you can join giveaways or chat with the community, you need to set a custom username.
        </p>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1">
              Guest Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. LukeSkywalker"
              className="brutal w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black"
              maxLength={20}
              required
            />
            {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="brutal-press mt-2 w-full rounded-xl bg-lime py-3 text-sm font-bold text-lime-foreground disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Username"}
          </button>
        </form>
      </div>
    </div>
  );
}
