const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Calculate a 0–100 match score for a location against user preferences.
 *
 * Weights:
 *   Budget fit   30%  — how much rent is under the max budget
 *   Commute      25%  — how much commute is under the max limit
 *   Safety       20%  — safety score / 10
 *   Transit      10%  — transit score / 10
 *   Amenities    10%  — amenities score / 10
 *   Lifestyle     5%  — household-specific score / 10
 */
export function calculateMatchScore(location, preferences) {
  const budget     = Number(preferences?.budget || 35000);
  const maxCommute = Number(preferences?.maxCommute || 60);
  const household  = preferences?.household || "Student";

  // Budget: skip if rent is 0 (not loaded yet) — use neutral score
  let budgetScore = 15; // neutral midpoint if unknown
  if (location.rent > 0 && budget > 0) {
    budgetScore = clamp(1 - location.rent / budget, 0, 1) * 30;
  }

  // Commute: skip if commute is 0 (not loaded yet) — use neutral score
  let commuteScore = 12; // neutral midpoint if unknown
  if (location.commute > 0 && maxCommute > 0) {
    commuteScore = clamp(1 - location.commute / maxCommute, 0, 1) * 25;
  }

  const safetyScore     = (location.safety    / 10) * 20;
  const transitScore    = (location.transit   / 10) * 10;
  const amenitiesScore  = (location.amenities / 10) * 10;

  let lifestyleScore = 0;
  if (household === "Family")  lifestyleScore = (location.familyFriendly  / 10) * 5;
  if (household === "Couple")  lifestyleScore = (location.coupleFriendly  / 10) * 5;
  if (household === "Student") lifestyleScore = (location.studentFriendly / 10) * 5;

  return Math.round(budgetScore + commuteScore + safetyScore + transitScore + amenitiesScore + lifestyleScore);
}

/**
 * Build a plain-English explanation of why a location is the top pick.
 */
export function buildRecommendationReason(location, preferences) {
  const lines = [];
  const household  = preferences?.household || "Student";
  const maxBudget  = preferences?.budget    || 35000;
  const maxCommute = preferences?.maxCommute || 60;

  if (location.commute > 0) {
    if (location.commute <= 20)
      lines.push(`shortest commute at just ${location.commute} min`);
    else if (location.commute <= maxCommute * 0.6)
      lines.push(`comfortable ${location.commute}-min commute`);
    else
      lines.push(`${location.commute}-min commute within your limit`);
  }

  if (location.rent > 0) {
    const savings = maxBudget - location.rent;
    if (savings >= 5000)
      lines.push(`₹${savings.toLocaleString()} under your budget`);
    else
      lines.push(`rent fits your budget`);
  }

  if (location.safety >= 9)      lines.push("excellent safety score");
  else if (location.safety >= 8) lines.push("good safety");

  if (household === "Family"  && location.familyFriendly  >= 8.5) lines.push("highly family-friendly");
  if (household === "Couple"  && location.coupleFriendly  >= 8.5) lines.push("great for couples");
  if (household === "Student" && location.studentFriendly >= 8.5) lines.push("popular with students");

  if (location.amenities >= 9)           lines.push("top-tier amenities nearby");
  else if (location.liveData?.food > 20) lines.push("excellent food & café scene");

  return lines.slice(0, 3).join(" · ") || "best overall match for your criteria";
}
