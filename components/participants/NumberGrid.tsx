"use client";

interface NumberGridProps {
  roomId: string;
  minNumber: number;
  maxNumber: number;
  takenNumbers: number[];
  selectedNumber?: number | null;
  onSelect: (number: number) => void;
}

/**
 * NumberGrid — Client Component.
 * Used for ranges ≤ 100 numbers. Renders a visual grid of 44px touch-target buttons.
 * - Green: available
 * - Dark/filled: taken (disabled)
 * - Blue: current user's selection
 */
export function NumberGrid({
  minNumber,
  maxNumber,
  takenNumbers,
  selectedNumber,
  onSelect,
}: NumberGridProps) {
  const takenSet = new Set(takenNumbers);
  const numbers = Array.from(
    { length: maxNumber - minNumber + 1 },
    (_, i) => minNumber + i
  );

  const taken = takenNumbers.length;
  const total = numbers.length;
  const available = total - taken;

  return (
    <div>
      {/* Stats bar */}
      <div
        className="flex gap-3 mb-3 text-xs font-bold flex-wrap"
        aria-live="polite"
        aria-label={`${available} of ${total} numbers available`}
      >
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 border border-[var(--color-border)] inline-block"
            style={{ background: "var(--color-background)" }}
            aria-hidden="true"
          />
          Available ({available})
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 border border-[var(--color-border)] inline-block"
            style={{ background: "var(--color-foreground)" }}
            aria-hidden="true"
          />
          Taken ({taken})
        </span>
        {selectedNumber && (
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 border border-[var(--color-border)] inline-block"
              style={{ background: "var(--color-primary)" }}
              aria-hidden="true"
            />
            Your pick
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={`Number grid ${minNumber} to ${maxNumber}`}
      >
        {numbers.map((n) => {
          const isTaken = takenSet.has(n);
          const isSelected = n === selectedNumber;

          let btnClass = "neo-number-btn";
          let ariaLabel = `Number ${n}`;
          let disabled = false;

          if (isSelected) {
            btnClass += " neo-number-btn-selected";
            ariaLabel += " (your selection)";
            disabled = true;
          } else if (isTaken) {
            btnClass += " neo-number-btn-taken";
            ariaLabel += " (taken)";
            disabled = true;
          }

          return (
            <button
              key={n}
              onClick={() => !disabled && onSelect(n)}
              disabled={disabled}
              className={btnClass}
              aria-label={ariaLabel}
              aria-pressed={isSelected}
              id={`number-btn-${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
