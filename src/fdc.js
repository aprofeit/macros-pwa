const FDC_API_BASE = "/api/fdc";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch { /* ignore */ }
    throw new Error(`USDA request failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return await res.json();
}

export function hasFdcKey() {
  // Client may have VITE_FDC_API_KEY. Dev server can also expose availability via
  // vite `define` when only FDC_API_KEY is set (proxy active; key never sent to the client).
  if (String(import.meta.env?.VITE_FDC_API_KEY ?? "").trim()) return true;
  return __FDC_PROXY_ACTIVE__;
}

export async function fdcSearchFoods(query, { pageSize = 10 } = {}) {
  const q = String(query ?? "").trim();
  if (!q) return [];
  const url = `${FDC_API_BASE}/search`;
  const data = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, pageSize }),
  });
  return Array.isArray(data?.foods) ? data.foods : [];
}

export async function fdcGetFood(fdcId) {
  const url = `${FDC_API_BASE}/food/${encodeURIComponent(String(fdcId))}`;
  return await fetchJson(url);
}

function pickNutrientValue(nutrients, names) {
  const set = new Set(names.map(n => String(n).toLowerCase()));
  const hit = (Array.isArray(nutrients) ? nutrients : []).find(n => set.has(String(n?.nutrient?.name ?? n?.nutrientName ?? "").toLowerCase()));
  if (!hit) return null;
  const v = hit?.amount ?? hit?.value ?? null;
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

export function extractPer100gMacros(foodDetail) {
  const nutrients = foodDetail?.foodNutrients ?? [];

  const protein = pickNutrientValue(nutrients, ["Protein"]);
  const fat = pickNutrientValue(nutrients, ["Total lipid (fat)"]);
  const carbs = pickNutrientValue(nutrients, ["Carbohydrate, by difference"]);

  const kcalDirect = pickNutrientValue(nutrients, ["Energy"]);
  const kj = pickNutrientValue(nutrients, ["Energy (Atwater General Factors)", "Energy (Atwater Specific Factors)", "Energy (kJ)"]);

  // FDC can represent Energy with different units depending on dataset.
  // Prefer kcal when possible; otherwise convert kJ -> kcal.
  let kcal = null;
  const energyUnit = String(
    (Array.isArray(nutrients) ? nutrients : []).find(n => String(n?.nutrient?.name ?? n?.nutrientName ?? "").toLowerCase() === "energy")?.nutrient?.unitName
    ?? ""
  ).toLowerCase();

  if (Number.isFinite(kcalDirect) && (energyUnit === "kcal" || energyUnit === "")) kcal = kcalDirect;
  if (kcal == null && Number.isFinite(kcalDirect) && energyUnit === "kj") kcal = kcalDirect / 4.184;
  if (kcal == null && Number.isFinite(kj)) kcal = kj / 4.184;

  return {
    name: foodDetail?.description ?? foodDetail?.lowercaseDescription ?? "",
    protein,
    fat,
    carbs,
    kcal: kcal == null ? null : Math.round(kcal),
  };
}

