import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "@/components/auth/LoginButton";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Gift, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — DrawUp",
  description: "Sign in with Google, email, or play instantly as a guest on DrawUp.",
  robots: "noindex",
};

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ redirectedFrom?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(params.redirectedFrom ?? "/rooms");

  const errorMessages: Record<string, string> = {
    no_code: "The sign-in link was invalid. Please try again.",
    auth_failed: "Something went wrong. Please try again.",
  };
  const oauthError = params.error ? errorMessages[params.error] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-2 w-full bg-primary" />
      <div className="mx-auto w-full max-w-sm px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-display text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Home
        </Link>
      </div>

      <main
        id="main-content"
        className="animate-rise mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 pb-8 pt-4"
      >
        {/* Identity card */}
        <div className="brutal flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-card-foreground">
          <span className="brutal flex h-16 w-16 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
            <Gift className="h-8 w-8" strokeWidth={2.5} />
          </span>
          <div className="text-center">
            <h1 className="font-display text-2xl tracking-tight">Welcome to DrawUp</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Fair, transparent giveaways for your community.
            </p>
          </div>
        </div>

        {/* Auth card */}
        <div className="brutal flex flex-col gap-4 rounded-2xl bg-card p-6 text-card-foreground">
          <p className="text-center font-display text-xs uppercase tracking-widest text-muted-foreground">
            Choose how to join
          </p>

          {oauthError && (
            <div
              role="alert"
              className="brutal rounded-xl bg-pink p-3 text-center text-sm font-medium text-pink-foreground"
            >
              ⚠️ {oauthError}
            </div>
          )}

          {/* Google OAuth */}
          <LoginButton redirectTo={params.redirectedFrom ?? "/rooms"} />

          {/* Guest */}
          <Link
            href={`/rooms${params.redirectedFrom ? `?from=${params.redirectedFrom}` : ""}`}
            className="brutal-press flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime font-display text-lime-foreground"
          >
            <Zap className="h-5 w-5" strokeWidth={2.5} />
            Play as Guest
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-[3px] flex-1 bg-border" />
            <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-[3px] flex-1 bg-border" />
          </div>

          {/* Email */}
          <EmailAuthForm redirectTo={params.redirectedFrom ?? "/rooms"} mode="signin" />

          <p className="text-center text-sm font-bold">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🔒", label: "Secure" },
            { icon: "⚡", label: "Real-time" },
            { icon: "📱", label: "Mobile-first" },
          ].map((f) => (
            <div key={f.label} className="brutal rounded-xl bg-card p-3 text-center text-card-foreground">
              <div className="text-xl">{f.icon}</div>
              <p className="mt-1 text-xs font-bold">{f.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
