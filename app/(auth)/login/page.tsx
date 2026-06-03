import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/auth/LoginButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Giveaway App",
  description:
    "Sign in with Google, your email, or play instantly as a guest to join and create giveaways.",
  robots: "noindex",
};

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ redirectedFrom?: string; error?: string }>;
}

/**
 * Login Page — Server Component.
 * Supports three auth methods: Google OAuth, Email/Password, and Guest Login.
 * Redirects to home if the user is already authenticated.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Already authenticated → skip login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(params.redirectedFrom ?? "/");
  }

  const errorMessages: Record<string, string> = {
    no_code: "The sign-in link was invalid. Please try again.",
    auth_failed: "Something went wrong during sign-in. Please try again.",
  };
  const oauthError = params.error ? errorMessages[params.error] : null;

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      id="main-content"
    >
      {/* Background */}
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

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* ───── Header Card ───── */}
        <div
          className="neo-card p-6 flex flex-col items-center gap-4"
        >
          {/* App icon */}
          <div
            className="w-16 h-16 flex items-center justify-center text-3xl border-3 border-[var(--color-border)]"
            style={{
              background: "var(--color-accent)",
              boxShadow: "var(--shadow-neo)",
            }}
            aria-hidden="true"
          >
            🎁
          </div>

          <div className="text-center">
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Giveaway App
            </h1>
            <p
              className="text-sm font-medium mt-1"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Fair, transparent giveaways for your community.
            </p>
          </div>
        </div>

        {/* ───── Auth Card ───── */}
        <div className="neo-card p-6 flex flex-col gap-5">

          {/* Section label */}
          <p
            className="text-xs font-black uppercase tracking-widest text-center"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-display)" }}
          >
            Choose how to join
          </p>

          {/* OAuth error from redirect */}
          {oauthError && (
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
              ⚠️ {oauthError}
            </div>
          )}

          {/* ── Method 1: Google OAuth ── */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-black uppercase tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🌐 With Google
            </p>
            <LoginButton redirectTo={params.redirectedFrom ?? "/"} />
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <div
              className="flex-1 h-[3px]"
              style={{ background: "var(--color-border)" }}
            />
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              or
            </span>
            <div
              className="flex-1 h-[3px]"
              style={{ background: "var(--color-border)" }}
            />
          </div>

          {/* ── Method 2 & 3: Email/Password + Guest ── */}
          <div className="flex flex-col gap-2">
            <p
              className="text-xs font-black uppercase tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ✉️ With Email or Guest
            </p>
            <EmailAuthForm redirectTo={params.redirectedFrom ?? "/"} mode="signin" />
          </div>

          {/* ── Go to Register ── */}
          <p className="text-center text-sm font-bold mt-2">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-[var(--color-primary)] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* ───── Terms ───── */}
        <p
          className="text-xs text-center leading-relaxed px-2"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          By signing in, you agree to use this platform fairly.
          <br />
          No spam. One real account per person.
        </p>

        {/* ───── Feature highlights ───── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🔒", label: "Secure Drawing" },
            { icon: "⚡", label: "Real-time" },
            { icon: "📱", label: "Mobile-first" },
          ].map(({ icon, label }) => (
            <div key={label} className="neo-card p-3 text-center">
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
