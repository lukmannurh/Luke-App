"use client";

import { useState, useTransition, useActionState } from "react";
import { signUp, signInWithPassword, loginAsGuest } from "@/app/(auth)/login/actions";

type Mode = "signin" | "signup";

interface EmailAuthFormProps {
  redirectTo?: string;
  mode: Mode;
}

const initialState = { error: null };

/**
 * EmailAuthForm — handles both Email Sign Up and Sign In.
 * Implements Neobrutalism design tokens throughout.
 */
export function EmailAuthForm({ redirectTo = "/", mode }: EmailAuthFormProps) {
  const [isGuestPending, startGuestTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const [signInState, signInAction, isSignInPending] = useActionState(
    signInWithPassword,
    initialState
  );
  const [signUpState, signUpAction, isSignUpPending] = useActionState(
    signUp,
    initialState
  );

  const isPending = isSignInPending || isSignUpPending;
  const currentError = mode === "signin" ? signInState.error : signUpState.error;
  const currentAction = mode === "signin" ? signInAction : signUpAction;

  function handleGuestLogin() {
    startGuestTransition(async () => {
      await loginAsGuest();
    });
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ----- Email/Password Form ----- */}
      <form action={currentAction} className="flex flex-col gap-3">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        {/* Email Field */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email-input"
            className="text-xs font-black uppercase tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Email
          </label>
          <input
            id="email-input"
            name="email"
            type="email"
            required
            autoComplete={mode === "signup" ? "email" : "username"}
            placeholder="you@example.com"
            disabled={isPending}
            className="w-full px-3 py-3 text-sm font-medium border-3 border-[var(--color-border)] bg-[var(--color-background)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
            style={{
              boxShadow: "2px 2px 0px var(--color-border)",
              minHeight: "44px",
            }}
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="password-input"
            className="text-xs font-black uppercase tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Password{mode === "signup" && <span className="font-normal normal-case ml-1 text-[var(--color-muted-foreground)]">(min 8 chars)</span>}
          </label>
          <div className="relative">
            <input
              id="password-input"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Create a password" : "Your password"}
              minLength={mode === "signup" ? 8 : undefined}
              disabled={isPending}
              className="w-full pl-3 pr-10 py-3 text-sm font-medium border-3 border-[var(--color-border)] bg-[var(--color-background)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow"
              style={{
                boxShadow: "2px 2px 0px var(--color-border)",
                minHeight: "44px",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {currentError && (
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
            ⚠️ {currentError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          id={mode === "signin" ? "email-signin-btn" : "email-signup-btn"}
          disabled={isPending}
          className="neo-btn neo-btn-primary neo-btn-lg neo-btn-full flex items-center justify-center gap-2 mt-2"
          style={{ minHeight: "48px" }}
        >
          {isPending ? (
            <>
              <span
                className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span>{mode === "signin" ? "Signing in…" : "Creating account…"}</span>
            </>
          ) : (
            <span>{mode === "signin" ? "Sign In with Email" : "Create Account"}</span>
          )}
        </button>
      </form>

      {/* ----- Guest Login Button (Only for Sign In) ----- */}
      {mode === "signin" && (
        <>
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="flex-1 h-[3px]" style={{ background: "var(--color-border)" }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>
              or
            </span>
            <div className="flex-1 h-[3px]" style={{ background: "var(--color-border)" }} />
          </div>
          
          <button
            type="button"
            id="guest-login-btn"
            onClick={handleGuestLogin}
            disabled={isGuestPending || isPending}
            className="neo-btn neo-btn-lg neo-btn-full flex items-center justify-center gap-2"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-accent-foreground)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-neo)",
              minHeight: "48px",
            }}
            aria-label="Play as a guest without creating an account"
          >
            {isGuestPending ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>Joining as Guest…</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">🎭</span>
                <span className="font-black" style={{ fontFamily: "var(--font-display)" }}>
                  Play as Guest
                </span>
              </>
            )}
          </button>
          
          <p className="text-xs text-center" style={{ color: "var(--color-muted-foreground)" }}>
            Guest accounts have full access but cannot recover progress.
          </p>
        </>
      )}
    </div>
  );
}
