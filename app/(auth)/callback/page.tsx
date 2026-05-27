import { redirect } from "next/navigation";

/**
 * This page is never actually rendered — the OAuth callback is handled by
 * the API route at /api/auth/callback, which immediately redirects.
 * This placeholder prevents a 404 if the browser briefly shows this URL.
 */
export default function CallbackPage() {
  redirect("/");
}
