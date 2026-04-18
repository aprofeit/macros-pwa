/** Normalize user query: trim, collapse whitespace, lowercase. */
export function normalizeQuery(q) {
  return String(q ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function queryTokens(normalizedQuery) {
  return normalizedQuery.split(/\s+/).filter(Boolean);
}

/** Every token must appear as a substring of the normalized name (order-independent). */
export function foodMatchesNameQuery(nameNorm, tokens) {
  if (tokens.length === 0) return false;
  return tokens.every((t) => nameNorm.includes(t));
}

const PHRASE_BONUS = 1000;
const W_USE = 2;
const W_PICK = 12;

/**
 * Deterministic relevance: phrase substring bonus + sum of 1000/(index+1) per token.
 */
function relevanceScore(nameNorm, fullQueryNorm, tokens) {
  let s = 0;
  if (fullQueryNorm && nameNorm.includes(fullQueryNorm)) s += PHRASE_BONUS;
  for (const t of tokens) {
    const i = nameNorm.indexOf(t);
    if (i < 0) return -Infinity;
    s += 1000 / (i + 1);
  }
  return s;
}

/**
 * Relevance for ordering external search hits (USDA/OFF). Higher = better match.
 * Scores normalized "name brand" so brand text can help tie-breakers.
 */
export function scoreNameAgainstQuery(name, query, brand = null) {
  const fullQueryNorm = normalizeQuery(query);
  if (!fullQueryNorm) return -Infinity;
  const tokens = queryTokens(fullQueryNorm);
  if (tokens.length === 0) return -Infinity;
  const nameNorm = normalizeQuery([name, brand].filter(Boolean).join(" "));
  if (!foodMatchesNameQuery(nameNorm, tokens)) return -Infinity;
  return relevanceScore(nameNorm, fullQueryNorm, tokens);
}

function totalScore(food, nameNorm, fullQueryNorm, tokens, queryKey, pickCounts) {
  const rel = relevanceScore(nameNorm, fullQueryNorm, tokens);
  if (!Number.isFinite(rel)) return -Infinity;
  const id = String(food.id);
  const pick = (pickCounts?.[queryKey]?.[id] ?? 0);
  const use = food.useCount ?? 0;
  return rel + W_USE * use + W_PICK * pick;
}

/**
 * Foods matching all query tokens as substrings; sorted by match quality + useCount + search pick history.
 * @param {object} pickCounts - nested map: queryKey -> foodId string -> count
 */
export function rankFoodMatches(foods, query, pickCounts = {}) {
  const fullQueryNorm = normalizeQuery(query);
  if (!fullQueryNorm) return [];
  const tokens = queryTokens(fullQueryNorm);
  if (tokens.length === 0) return [];

  const matches = (Array.isArray(foods) ? foods : []).filter((f) => {
    const nameNorm = normalizeQuery(f?.name ?? "");
    return foodMatchesNameQuery(nameNorm, tokens);
  });

  matches.sort((a, b) => {
    const nameA = normalizeQuery(a?.name ?? "");
    const nameB = normalizeQuery(b?.name ?? "");
    const sa = totalScore(a, nameA, fullQueryNorm, tokens, fullQueryNorm, pickCounts);
    const sb = totalScore(b, nameB, fullQueryNorm, tokens, fullQueryNorm, pickCounts);
    if (sb !== sa) return sb - sa;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  return matches;
}

export function topFoodMatch(foods, query, pickCounts = {}) {
  const ranked = rankFoodMatches(foods, query, pickCounts);
  return ranked[0] ?? null;
}
