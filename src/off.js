const OFF_PROXY = "/api/off/search";

const OFF_RETRY_MAX = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function offSearchFoods(query, { pageSize = 10 } = {}) {
  const q = String(query ?? "").trim();
  if (!q) return [];

  // Always use same-origin `/api/off/search`: Vite proxies to Open Food Facts in dev;
  // Vercel serverless proxies in production. Direct browser calls hit CORS.
  const url = new URL(OFF_PROXY, location.origin);
  url.searchParams.set("q", q);
  url.searchParams.set("pageSize", String(pageSize));

  const urlString = url.toString();
  let res;
  for (let attempt = 1; attempt <= OFF_RETRY_MAX; attempt++) {
    res = await fetch(urlString);
    if (res.ok || res.status !== 503 || attempt === OFF_RETRY_MAX) break;
    await sleep(400 * attempt + Math.floor(Math.random() * 250));
  }
  if (!res.ok) throw new Error(`OFF search failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data?.products) ? data.products : [];
}

export function normalizeOffProduct(product) {
  const n = product?.nutriments ?? {};
  const kcalDirect = parseFloat(n["energy-kcal_100g"]);
  const kjDirect = parseFloat(n["energy_100g"]);
  let kcal = null;
  if (Number.isFinite(kcalDirect)) kcal = Math.round(kcalDirect);
  else if (Number.isFinite(kjDirect)) kcal = Math.round(kjDirect / 4.184);

  const protein = parseFloat(n["proteins_100g"]);
  const fat = parseFloat(n["fat_100g"]);
  const carbs = parseFloat(n["carbohydrates_100g"]);

  return {
    id: `off:${product.code}`,
    source: "OFF",
    name: product.product_name || "",
    brand: product.brands || null,
    dataType: null,
    macros: {
      protein: Number.isFinite(protein) ? protein : null,
      fat: Number.isFinite(fat) ? fat : null,
      carbs: Number.isFinite(carbs) ? carbs : null,
      kcal,
    },
    _raw: product,
  };
}
