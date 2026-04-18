import { fdcSearchFoods } from "./fdc.js";
import { offSearchFoods, normalizeOffProduct } from "./off.js";
import { scoreNameAgainstQuery } from "./matchFood.js";

function normalizeFdcResult(r) {
  return {
    id: `fdc:${r.fdcId}`,
    source: "USDA",
    name: r.description ?? "",
    brand: r.brandOwner ?? null,
    dataType: r.dataType ?? null,
    macros: null,
    _raw: r,
  };
}

function sortSearchResults(items, query) {
  const q = String(query ?? "").trim();
  if (!q) return items;
  return [...items].sort((a, b) => {
    const sa = scoreNameAgainstQuery(a.name, q, a.brand);
    const sb = scoreNameAgainstQuery(b.name, q, b.brand);
    if (sb !== sa) return sb - sa;
    const na = String(a.name ?? "");
    const nb = String(b.name ?? "");
    if (na !== nb) return na.localeCompare(nb);
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}

export async function searchAllSources(query, { pageSize = 10 } = {}) {
  const [fdcResult, offResult] = await Promise.allSettled([
    fdcSearchFoods(query, { pageSize }),
    offSearchFoods(query, { pageSize }),
  ]);

  const fdcItems =
    fdcResult.status === "fulfilled"
      ? fdcResult.value.map(normalizeFdcResult)
      : [];
  const offItems =
    offResult.status === "fulfilled"
      ? offResult.value.map(normalizeOffProduct).filter(r => r.name)
      : [];

  return sortSearchResults([...fdcItems, ...offItems], query);
}
