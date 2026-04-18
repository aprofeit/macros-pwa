/** Allowed: digits, whitespace, decimal point, + - * / ( ) */
const SAFE_CHARS = /^[0-9+\-*/().\s]+$/;

/**
 * Evaluate a simple arithmetic expression (e.g. "80 * 3 + 250").
 * @param {string} s
 * @returns {number | null} finite number, or null if invalid / unsafe / non-finite
 */
export function evaluateMathExpression(s) {
  const t = String(s ?? "").trim();
  if (!t) return null;
  if (!SAFE_CHARS.test(t)) return null;
  try {
    const fn = new Function(`"use strict"; return (${t});`);
    const v = fn();
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}
