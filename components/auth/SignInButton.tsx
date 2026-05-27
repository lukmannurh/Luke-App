"use client";

import { useRouter } from "next/navigation";

export function SignInButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/login")}
      className="neo-btn neo-btn-primary neo-btn-sm"
      id="header-signin"
    >
      Sign in
    </button>
  );
}
