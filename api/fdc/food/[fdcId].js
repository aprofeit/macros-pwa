const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

function getKey() {
  return process.env.FDC_API_KEY || process.env.VITE_FDC_API_KEY;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const apiKey = getKey();
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing FDC_API_KEY (or VITE_FDC_API_KEY) on server" }));
    return;
  }

  const { fdcId } = req.query ?? {};
  if (!fdcId) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing fdcId" }));
    return;
  }

  try {
    const url = new URL(`${FDC_BASE}/food/${encodeURIComponent(String(fdcId))}`);
    url.searchParams.set("api_key", apiKey);

    const upstream = await fetch(url.toString());
    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.end(text);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e?.message ?? "Upstream request failed" }));
  }
}

