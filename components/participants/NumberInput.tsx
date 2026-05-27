"use client";

import { useState, useRef } from "react";

interface NumberInputProps {
  roomId: string;
  minNumber: number;
  maxNumber: number;
  takenNumbers: number[];
  selectedNumber?: number | null;
  onSelect: (number: number) => void;
}

/**
 * NumberInput — Client Component.
 * Used for ranges > 500. Lets participants type their number directly.
 * Checks availability against the API before confirming selection.
 */
export function NumberInput({
  roomId,
  minNumber,
  maxNumber,
  takenNumbers,
  selectedNumber,
  onSelect,
}: NumberInputProps) {
  const [value, setValue] = useState<string>(
    selectedNumber ? String(selectedNumber) : ""
  );
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<"available" | "taken" | "error" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const takenSet = new Set(takenNumbers);
  const parsedValue = parseInt(value);
  const inRange =
    !isNaN(parsedValue) && parsedValue >= minNumber && parsedValue <= maxNumber;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    setCheckResult(null);

    // Debounce availability check
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const num = parseInt(v);
    if (isNaN(num) || num < minNumber || num > maxNumber) return;

    // Quick local check first
    if (takenSet.has(num)) {
      setCheckResult("taken");
      return;
    }

    setIsChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/participants`);
        const data = await res.json();
        const taken = new Set<number>(
          (data.takenNumbers as number[]) ?? []
        );
        setCheckResult(taken.has(num) ? "taken" : "available");
      } catch {
        setCheckResult("error");
      } finally {
        setIsChecking(false);
      }
    }, 500);
  }

  function handleConfirm() {
    if (!inRange || checkResult === "taken") return;
    onSelect(parsedValue);
  }

  const inputBorderClass =
    checkResult === "available"
      ? "neo-input"
      : checkResult === "taken" || checkResult === "error"
      ? "neo-input neo-input-error"
      : "neo-input";

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold" style={{ color: "var(--color-muted-foreground)" }}>
        Range: {minNumber.toLocaleString()} – {maxNumber.toLocaleString()} (
        {(maxNumber - minNumber + 1).toLocaleString()} numbers)
      </p>

      {/* Current selection badge */}
      {selectedNumber && (
        <div className="neo-badge neo-badge-primary inline-flex">
          ✅ Your pick: {selectedNumber}
        </div>
      )}

      {/* Number input + check */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <label htmlFor="number-direct-input" className="block text-sm font-bold mb-1">
            Enter your number
          </label>
          <input
            id="number-direct-input"
            type="number"
            value={value}
            onChange={handleChange}
            min={minNumber}
            max={maxNumber}
            step={1}
            placeholder={`${minNumber}–${maxNumber}`}
            className={inputBorderClass}
            aria-describedby="number-input-feedback"
            aria-invalid={checkResult === "taken" || checkResult === "error"}
          />
        </div>

        <button
          id="number-input-confirm"
          type="button"
          onClick={handleConfirm}
          disabled={
            !inRange ||
            isChecking ||
            checkResult === "taken" ||
            checkResult === "error"
          }
          className="neo-btn neo-btn-primary mt-6"
          aria-label="Confirm number selection"
        >
          {isChecking ? (
            <span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            "Pick"
          )}
        </button>
      </div>

      {/* Feedback */}
      <div id="number-input-feedback" aria-live="polite">
        {isChecking && (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Checking availability…
          </p>
        )}
        {!isChecking && checkResult === "available" && (
          <p className="text-sm font-bold" style={{ color: "var(--color-success)" }}>
            ✅ {parsedValue} is available! Click Pick to confirm.
          </p>
        )}
        {!isChecking && checkResult === "taken" && (
          <p className="text-sm font-bold" style={{ color: "var(--color-destructive)" }}>
            ❌ {parsedValue} is already taken. Choose another.
          </p>
        )}
        {!isChecking && checkResult === "error" && (
          <p className="text-sm font-bold" style={{ color: "var(--color-warning)" }}>
            ⚠️ Could not check availability. Try another number or submit anyway.
          </p>
        )}
        {!inRange && value.length > 0 && (
          <p className="text-sm" style={{ color: "var(--color-destructive)" }}>
            Must be between {minNumber} and {maxNumber}.
          </p>
        )}
      </div>
    </div>
  );
}
