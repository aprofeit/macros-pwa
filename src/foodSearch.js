import { fdcSearchFoods } from "./fdc.js";
import { offSearchFoods, normalizeOffProduct } from "./off.js";

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

function interleave(a, b) {
  const out = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
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

  return interleave(fdcItems, offItems);
}
