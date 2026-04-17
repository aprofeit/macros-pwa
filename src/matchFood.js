/** Normalize user query: trim, collapse whitespace, lowercase. */
export function normalizeQuery(q) {
  return String(q ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Foods whose name (normalized) starts with the normalized query. Name-only; ignores `code`.
 */
export function rankFoodMatches(foods, query) {
  const nq = normalizeQuery(query);
  if (!nq) return [];
  const matches = (Array.isArray(foods) ? foods : []).filter((f) => {
    const name = normalizeQuery(f?.name ?? "");
    return name.startsWith(nq);
  });
  matches.sort((a, b) => {
    const uc = (b.useCount ?? 0) - (a.useCount ?? 0);
    if (uc !== 0) return uc;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });
  return matches;
}

export function topFoodMatch(foods, query) {
  const ranked = rankFoodMatches(foods, query);
  return ranked[0] ?? null;
}
