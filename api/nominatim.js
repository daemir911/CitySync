/**
 * Vercel serverless proxy for Nominatim.
 * Adds User-Agent server-side (forbidden header in browsers).
 * Route: GET /api/nominatim?q=...&format=json&...
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Forward all query params except internal ones
    const params = { ...req.query };
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(params)}`;

    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "CitySync/1.0 (https://github.com/Meet8376/CitySync)",
        "Accept": "application/json",
        "Accept-Language": "en",
        "Referer": "https://citysync.vercel.app",
      },
    });

    const data = await upstream.json();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
