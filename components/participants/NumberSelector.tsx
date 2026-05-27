"use client";

import dynamic from "next/dynamic";

interface NumberSelectorProps {
  roomId: string;
  minNumber: number;
  maxNumber: number;
  takenNumbers: number[];
  /** User's already-selected number (if joined) */
  selectedNumber?: number | null;
  onSelect: (number: number) => void;
}

// ── Lazy-loaded sub-components (SSR disabled — they're pure client) ──────────

const NumberGrid = dynamic(
  () => import("@/components/participants/NumberGrid").then((m) => m.NumberGrid),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex flex-wrap gap-1.5"
        aria-busy="true"
        aria-label="Loading number grid…"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-11 h-11 animate-pulse"
            style={{ background: "var(--color-muted)", border: "2px solid var(--color-border)" }}
            aria-hidden="true"
          />
        ))}
      </div>
    ),
  }
);

const NumberDropdown = dynamic(
  () => import("@/components/participants/NumberDropdown").then((m) => m.NumberDropdown),
  {
    ssr: false,
    loading: () => (
      <div
        className="neo-input animate-pulse"
        style={{ background: "var(--color-muted)" }}
        aria-busy="true"
        aria-label="Loading number picker…"
      />
    ),
  }
);

const NumberInput = dynamic(
  () => import("@/components/participants/NumberInput").then((m) => m.NumberInput),
  {
    ssr: false,
    loading: () => (
      <div
        className="neo-input animate-pulse"
        style={{ background: "var(--color-muted)" }}
        aria-busy="true"
        aria-label="Loading number input…"
      />
    ),
  }
);

/**
 * NumberSelector — Client Component.
 * Chooses the appropriate number-picking UI based on range size:
 * - ≤ 100: NumberGrid (visual button grid) — lazy loaded
 * - 101–500: NumberDropdown (searchable scrollable list) — lazy loaded
 * - > 500: NumberInput (direct entry with availability check) — lazy loaded
 */
export function NumberSelector(props: NumberSelectorProps) {
  const { minNumber, maxNumber } = props;
  const rangeSize = maxNumber - minNumber + 1;

  if (rangeSize <= 100) {
    return <NumberGrid {...props} />;
  }

  if (rangeSize <= 500) {
    return <NumberDropdown {...props} />;
  }

  return <NumberInput {...props} />;
}
