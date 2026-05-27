"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface NumberDropdownProps {
  roomId: string;
  minNumber: number;
  maxNumber: number;
  takenNumbers: number[];
  selectedNumber?: number | null;
  onSelect: (number: number) => void;
}

/**
 * NumberDropdown — Client Component.
 * Used for ranges 101–500. Shows a searchable, scrollable list of available numbers.
 */
export function NumberDropdown({
  minNumber,
  maxNumber,
  takenNumbers,
  selectedNumber,
  onSelect,
}: NumberDropdownProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const takenSet = new Set(takenNumbers);

  const allNumbers = useMemo(
    () =>
      Array.from({ length: maxNumber - minNumber + 1 }, (_, i) => minNumber + i),
    [minNumber, maxNumber]
  );

  const filteredNumbers = useMemo(() => {
    const query = search.trim();
    if (!query) return allNumbers;
    return allNumbers.filter((n) => String(n).includes(query));
  }, [allNumbers, search]);

  const available = allNumbers.filter((n) => !takenSet.has(n)).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(n: number) {
    onSelect(n);
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Stats */}
      <p className="text-xs font-bold mb-2" style={{ color: "var(--color-muted-foreground)" }}>
        {available} of {allNumbers.length} numbers available
      </p>

      {/* Trigger button */}
      <button
        id="number-dropdown-trigger"
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="neo-input text-left flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select your lucky number"
      >
        <span className={selectedNumber ? "font-bold" : ""} style={{ color: selectedNumber ? "var(--color-primary)" : "var(--color-muted-foreground)" }}>
          {selectedNumber ? `✅ Number ${selectedNumber} (your pick)` : "Choose a number…"}
        </span>
        <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 neo-card"
          style={{ boxShadow: "var(--shadow-neo-lg)" }}
          role="dialog"
          aria-label="Number selection"
        >
          {/* Search input */}
          <div
            className="p-2"
            style={{ borderBottom: "2px solid var(--color-border)" }}
          >
            <input
              id="number-dropdown-search"
              type="number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${minNumber}–${maxNumber}…`}
              className="neo-input neo-btn-sm"
              autoFocus
              aria-label="Search for a number"
            />
          </div>

          {/* Scrollable list */}
          <ul
            role="listbox"
            aria-label="Available numbers"
            className="overflow-y-auto"
            style={{ maxHeight: "240px" }}
          >
            {filteredNumbers.length === 0 ? (
              <li
                className="px-4 py-3 text-sm"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                No numbers match your search.
              </li>
            ) : (
              filteredNumbers.map((n) => {
                const isTaken = takenSet.has(n);
                const isSelected = n === selectedNumber;

                return (
                  <li
                    key={n}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isTaken}
                    id={`dropdown-option-${n}`}
                  >
                    <button
                      type="button"
                      onClick={() => !isTaken && handleSelect(n)}
                      disabled={isTaken}
                      className="w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors"
                      style={{
                        background: isSelected
                          ? "var(--color-primary)"
                          : isTaken
                          ? "var(--color-muted)"
                          : undefined,
                        color: isSelected
                          ? "var(--color-primary-foreground)"
                          : isTaken
                          ? "var(--color-muted-foreground)"
                          : undefined,
                        cursor: isTaken ? "not-allowed" : "pointer",
                      }}
                    >
                      <span>{n}</span>
                      {isSelected && <span aria-hidden="true">✓ your pick</span>}
                      {isTaken && !isSelected && (
                        <span className="text-xs" aria-label="taken">Taken</span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
