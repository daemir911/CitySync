/**
 * Vercel serverless proxy for Overpass API.
 * Adds User-Agent server-side. Accepts JSON body { data: <query> }.
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const query = req.body?.data || "";
    if (!query) return res.status(400).json({ error: "Missing data field" });

    const upstream = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CitySync/1.0 (https://github.com/Meet8376/CitySync)",
        "Accept": "application/json",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    const data = await upstream.json();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
