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
 * Reverse geocode lat/lon to a human-readable address.
 */
export async function reverseGeocode(lat, lon) {
  const key = `rev:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CitySync/1.0 (citysync-app)" },
    });
    const data = await res.json();
    const result = {
      displayName: data.display_name || `${lat}, ${lon}`,
      address: data.address || {},
    };
    sessionStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}
