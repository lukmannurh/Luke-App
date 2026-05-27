"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";

interface UserMenuProps {
  user: User;
}

/**
 * UserMenu — avatar button with a dropdown showing user info and sign-out.
 * Client Component (uses dropdown interaction).
 */
export function UserMenu({ user }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      // The route handler redirects to /login, but we force a full navigation
      // to ensure all client state is cleared.
      window.location.href = "/login";
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="user-menu-trigger"
          aria-label={`User menu for ${user.username}`}
          className="flex items-center gap-2 neo-btn neo-btn-outline neo-btn-sm"
        >
          {/* Avatar */}
          <span className="relative flex-shrink-0 w-7 h-7 border-2 border-[var(--color-border)] overflow-hidden rounded-none">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <span
                className="flex items-center justify-center w-full h-full text-xs font-black"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
              >
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </span>

          {/* Username — hidden on very small screens */}
          <span className="hidden sm:block font-bold text-sm max-w-[120px] truncate">
            {user.username}
          </span>

          {/* Chevron */}
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52 border-3 border-[var(--color-border)]"
        style={{ boxShadow: "var(--shadow-neo)" }}
      >
        {/* User info header */}
        <div className="px-3 py-2">
          <p className="font-black text-sm truncate" style={{ fontFamily: "var(--font-display)" }}>
            {user.username}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
            {user.email}
          </p>
        </div>

        <DropdownMenuSeparator className="border-t-2 border-[var(--color-border)]" />

        <DropdownMenuItem asChild>
          <a
            href="/"
            id="usermenu-home"
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <span aria-hidden="true">🏠</span>
            Home
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href="/profile"
            id="usermenu-profile"
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <span aria-hidden="true">👤</span>
            My Profile
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href="/rooms/history"
            id="usermenu-history"
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <span aria-hidden="true">📜</span>
            Drawing History
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border-t-2 border-[var(--color-border)]" />

        <DropdownMenuItem
          id="usermenu-signout"
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
          disabled={isSigningOut}
          className="flex items-center gap-2 cursor-pointer font-medium"
          style={{ color: "var(--color-destructive)" }}
        >
          <span aria-hidden="true">{isSigningOut ? "⏳" : "🚪"}</span>
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
