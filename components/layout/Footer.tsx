/**
 * Footer — Server Component. Minimal, neobrutalism-styled.
 */
export function Footer() {
  return (
    <footer
      className="mt-auto py-6 px-4 text-center"
      style={{
        borderTop: "3px solid var(--color-border)",
        background: "var(--color-muted)",
      }}
    >
      <p
        className="text-sm font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-muted-foreground)" }}
      >
        Giveaway App — Fair draws, every time. <span aria-hidden="true">🎁</span> | Created by Lil Luke Son of Owi
      </p>
    </footer>
  );
}
