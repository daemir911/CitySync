/**
 * Geocoding via Nominatim (OpenStreetMap) — free, no API key required.
 * Rate limit: 1 req/sec. We cache results in sessionStorage.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";

function cacheKey(query) {
  return `nominatim:${query.toLowerCase().trim()}`;
}

/**
 * Convert a place name to { lat, lon, displayName }.
 * Returns null if not found.
 */
export async function geocode(placeName) {
  const key = cacheKey(placeName);
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const url = `${NOMINATIM}/search?q=${encodeURIComponent(placeName)}&format=json&limit=1&countrycodes=in`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CitySync/1.0 (citysync-app)" },
    });
    const data = await res.json();
    if (!data.length) return null;

    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };

    sessionStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

/**
 * Search for real neighbourhoods/suburbs in a city using Nominatim.
 * Returns up to `limit` results as location-like objects.
 *
 * @param {string} cityName  e.g. "Pune", "Hyderabad"
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function searchNeighbourhoods(cityName, limit = 12) {
  const key = `nh:${cityName.toLowerCase().trim()}:${limit}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  // Search for suburbs/neighbourhoods/quarters in the city
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(cityName)}&format=json&limit=${limit * 3}&countrycodes=in&addressdetails=1&featuretype=settlement`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CitySync/1.0 (citysync-app)" },
    });
    const data = await res.json();

    // Filter to suburb/neighbourhood/quarter/city_block types
    const relevant = data.filter((item) =>
      ["suburb", "neighbourhood", "quarter", "city_block", "town", "village", "residential"].includes(
        item.type
      )
    );

    // Deduplicate by display name prefix
    const seen = new Set();
    const results = [];

    for (const item of relevant) {
      const a = item.address || {};
      const name =
        a.suburb ||
        a.neighbourhood ||
        a.quarter ||
        a.residential ||
        item.name;

      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      const city =
        a.city || a.town || a.county || a.state_district || cityName;

      results.push({
        id: `dyn_${item.osm_id}`,
        name: `${name}, ${city}`,
        city,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        // Placeholder scores — overwritten by live Overpass data
        rent: 0,
        commute: 0,
        safety: 7,
        transit: 7,
        amenities: 7,
        schools: 7,
        parks: 7,
        nightlife: 6,
        familyFriendly: 7,
        coupleFriendly: 7,
        studentFriendly: 7,
        description: `A neighbourhood in ${city}.`,
        highlights: [],
        nearbyLandmarks: [],
        transportOptions: [],
        isDynamic: true,
      });

      if (results.length >= limit) break;
    }

    sessionStorage.setItem(key, JSON.stringify(results));
    return results;
  } catch {
    return [];
  }
}
