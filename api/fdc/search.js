const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

function getKey() {
  return process.env.FDC_API_KEY || process.env.VITE_FDC_API_KEY;
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
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

  try {
    const body = await readJson(req);
    const url = new URL(`${FDC_BASE}/foods/search`);
    url.searchParams.set("api_key", apiKey);

    const upstream = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: body?.query ?? "",
        pageSize: body?.pageSize ?? 10,
      }),
    });

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

