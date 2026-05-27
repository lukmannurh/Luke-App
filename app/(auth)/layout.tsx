/**
 * Auth layout — minimal wrapper for login/callback pages.
 * No header or navigation — just centers the content.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
