const OFF_BASE = "https://world.openfoodfacts.org/cgi/search.pl";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const { q = "", pageSize = "10" } = req.query ?? {};

  const url = new URL(OFF_BASE);
  url.searchParams.set("search_terms", q);
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("fields", "product_name,nutriments,code,brands");

  const upstream = await fetch(url.toString());
  const text = await upstream.text();
  res.statusCode = upstream.status;
  res.setHeader("Content-Type", "application/json");
  res.end(text);
}
