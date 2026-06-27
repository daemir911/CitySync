/**
 * OpenStreetMap Overpass API — fetches real amenity counts around a point.
 * Free, no API key. Uses the official overpass-api.de endpoint.
 */

const OVERPASS = "https://overpass-api.de/api/interpreter";

/**
 * Count amenities of given types within `radiusMeters` of a lat/lon.
 * @param {number} lat
 * @param {number} lon
 * @param {string[]} amenityTypes  e.g. ["hospital","school","supermarket"]
 * @param {number} radiusMeters
 * @returns {Promise<number>} count of matching nodes
 */
export async function countAmenities(lat, lon, amenityTypes, radiusMeters = 1500) {
  const cacheKey = `overpass:${lat.toFixed(4)},${lon.toFixed(4)}:${amenityTypes.join(",")}:${radiusMeters}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const amenityFilter = amenityTypes.join("|");
  const query = `[out:json][timeout:20];(node["amenity"~"${amenityFilter}"](around:${radiusMeters},${lat},${lon});way["amenity"~"${amenityFilter}"](around:${radiusMeters},${lat},${lon}););out count;`;

  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CitySync/1.0",
        Accept: "application/json",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    const data = await res.json();
    const count = parseInt(data?.elements?.[0]?.tags?.total || "0", 10);
    sessionStorage.setItem(cacheKey, JSON.stringify(count));
    return count;
  } catch {
    return 0;
  }
}

/**
 * Fetch a full amenity profile for a neighbourhood.
 * Returns an object with counts per category.
 */
export async function getAmenityProfile(lat, lon, radiusMeters = 1500) {
  const cacheKey = `amenity_profile:${lat.toFixed(4)},${lon.toFixed(4)}:${radiusMeters}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const categories = {
    healthcare: ["hospital", "clinic", "pharmacy", "doctors"],
    education: ["school", "college", "university", "kindergarten", "library"],
    grocery: ["supermarket", "marketplace", "convenience"],
    food: ["restaurant", "cafe", "fast_food", "food_court"],
    leisure: ["park", "gym", "fitness_centre", "cinema", "theatre"],
    transport: ["bus_station", "taxi", "ferry_terminal"],
  };

  const profile = {};

  await Promise.all(
    Object.entries(categories).map(async ([category, types]) => {
      profile[category] = await countAmenities(lat, lon, types, radiusMeters);
    })
  );

  // Normalize to 0–10 scores based on reasonable upper bounds
  const bounds = {
    healthcare: 15,
    education: 20,
    grocery: 20,
    food: 100,
    leisure: 25,
    transport: 10,
  };

  const scores = {};
  for (const [cat, count] of Object.entries(profile)) {
    scores[`${cat}Count`] = count;
    scores[`${cat}Score`] = Math.min(10, parseFloat(((count / bounds[cat]) * 10).toFixed(1)));
  }

  // Composite scores
  scores.amenities = parseFloat(
    ((scores.healthcareScore + scores.groceryScore + scores.foodScore) / 3).toFixed(1)
  );
  scores.transit = scores.transportScore;

  const result = { raw: profile, scores };
  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}
