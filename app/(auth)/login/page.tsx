import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/auth/LoginButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in with your Google account to join and create giveaways.",
  robots: "noindex",
};

interface LoginPageProps {
  searchParams: Promise<{ redirectedFrom?: string; error?: string }>;
}

/**
 * Login Page — Server Component.
 * Redirects to home if the user is already authenticated.
 * Shows error message if OAuth failed.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // If already authenticated, redirect to home (or intended destination)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(params.redirectedFrom ?? "/");
  }

  const errorMessages: Record<string, string> = {
    no_code: "The sign-in link was invalid. Please try again.",
    auth_failed:
      "Something went wrong during sign-in. Please try again.",
  };

  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background: "var(--color-background)" }}
        aria-hidden="true"
      >
        {/* Neobrutalism accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ background: "var(--color-primary)" }}
        />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / App name */}
        <div className="neo-card p-8 mb-0">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 flex items-center justify-center text-4xl border-3 border-[var(--color-border)]"
              style={{
                background: "var(--color-accent)",
                boxShadow: "var(--shadow-neo)",
              }}
              aria-hidden="true"
            >
              🎁
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-black mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Giveaway App
            </h1>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Fair, transparent giveaways for your community.
              <br />
              Pick a lucky number and let fate decide.
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div
              role="alert"
              className="neo-card p-3 mb-6 text-sm font-medium text-center"
              style={{
                background: "#fef2f2",
                borderColor: "var(--color-destructive)",
                color: "var(--color-destructive)",
                boxShadow: "var(--shadow-neo-destructive)",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Login button */}
          <LoginButton
            redirectTo={params.redirectedFrom ?? "/"}
          />

          {/* Terms */}
          <p
            className="mt-6 text-xs text-center leading-relaxed"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            By signing in, you agree to use this platform fairly.
            <br />
            No spam accounts. One account per person.
          </p>
        </div>

        {/* Feature highlights — below the card */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "🔒", label: "Secure Drawing" },
            { icon: "⚡", label: "Real-time" },
            { icon: "📱", label: "Mobile-first" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="neo-card p-3 text-center"
            >
              <div className="text-xl mb-1" aria-hidden="true">
                {icon}
              </div>
              <p
                className="text-xs font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
