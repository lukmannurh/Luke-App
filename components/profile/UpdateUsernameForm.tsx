"use client";

import { useActionState } from "react";
import { updateUsername } from "@/app/(dashboard)/profile/actions";

export function UpdateUsernameForm({ currentUsername }: { currentUsername: string }) {
  const [state, action, isPending] = useActionState(updateUsername, { error: null, success: null } as any);

  return (
    <div className="neo-card p-6 flex flex-col gap-4">
      <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
        Update Username
      </h2>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="username-input"
            className="text-xs font-black uppercase tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Username
          </label>
          <input
            id="username-input"
            name="username"
            type="text"
            required
            defaultValue={currentUsername}
            minLength={3}
            disabled={isPending}
            className="w-full px-3 py-3 text-sm font-medium border-3 border-[var(--color-border)] bg-[var(--color-background)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            style={{
              boxShadow: "2px 2px 0px var(--color-border)",
              minHeight: "44px",
            }}
          />
        </div>

        {state.error && (
          <div
            role="alert"
            className="neo-card p-3 text-sm font-medium text-center"
            style={{
              background: "#fef2f2",
              borderColor: "var(--color-destructive)",
              color: "var(--color-destructive)",
              boxShadow: "var(--shadow-neo-destructive)",
            }}
          >
            ⚠️ {state.error}
          </div>
        )}

        {state.success && (
          <div
            role="alert"
            className="neo-card p-3 text-sm font-medium text-center"
            style={{
              background: "#f0fdf4",
              borderColor: "#16a34a",
              color: "#16a34a",
              boxShadow: "2px 2px 0px #16a34a",
            }}
          >
            ✅ {state.success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="neo-btn neo-btn-primary mt-2 flex justify-center items-center gap-2"
        >
          {isPending ? (
            <span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : null}
          Update Username
        </button>
      </form>
    </div>
  );
}
