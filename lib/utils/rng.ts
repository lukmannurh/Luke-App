/**
 * Cryptographically secure random number generator.
 *
 * Uses Node.js `crypto.randomInt` (CSPRNG) — NOT Math.random().
 * This is a server-only utility. Never import in Client Components.
 */

export interface WinnerSelection<T> {
  winner: T;
  sequence: number; // 1-indexed
}

/**
 * Fisher-Yates shuffle using `crypto.randomInt` for cryptographically
 * secure randomization.
 *
 * Returns a new shuffled array — does NOT mutate the input.
 */
export function secureShuffleArray<T>(array: T[]): T[] {
  const { randomInt } = require("crypto") as typeof import("crypto");
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Selects `count` winners from `participants` using a cryptographically
 * secure Fisher-Yates shuffle.
 *
 * Handles edge cases:
 * - If `count >= participants.length`, all participants win (in shuffled order).
 * - If `participants` is empty, returns an empty array.
 *
 * @param participants - Array of participant objects
 * @param count - Number of winners to select
 * @returns Array of winners with 1-indexed sequence numbers
 */
export function selectWinners<T>(
  participants: T[],
  count: number
): WinnerSelection<T>[] {
  if (participants.length === 0 || count <= 0) return [];

  const winnerCount = Math.min(count, participants.length);
  const shuffled = secureShuffleArray(participants);
  const selected = shuffled.slice(0, winnerCount);

  return selected.map((winner, index) => ({
    winner,
    sequence: index + 1,
  }));
}

/**
 * Generates a cryptographically secure random integer in [min, max).
 * Thin wrapper around crypto.randomInt for convenience.
 */
export function secureRandomInt(min: number, max: number): number {
  const { randomInt } = require("crypto") as typeof import("crypto");
  return randomInt(min, max);
}
