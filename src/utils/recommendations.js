const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Smooth exponential decay for commute scoring.
 * At 0 min  → 1.0  (perfect)
 * At limit  → 0.35 (still ok)
 * At 2×limit → ~0.1 (very poor)
 * Much more realistic than linear.
 */
function commuteDecay(commute, maxCommute) {
  if (commute <= 0) return null; // unknown
  return Math.exp(-1.05 * (commute / maxCommute));
}

/**
 * Calculate a 0–100 match score for a location against user preferences.
 *
 * Weights:
 *   Budget fit     28%  — how far under max budget
 *   Commute        27%  — exponential decay from limit
 *   Safety         18%  — safety score / 10
 *   Amenities      12%  — composite amenity score / 10
 *   Transit         8%  — transit score / 10
 *   Lifestyle       7%  — household-specific score / 10
 */
export function calculateMatchScore(location, preferences) {
  const budget     = Number(preferences?.budget || 35000);
  const maxCommute = Number(preferences?.maxCommute || 60);
  const household  = preferences?.household || "Student";

  // Budget score — use neutral midpoint if rent not loaded
  let budgetScore = 14;
  if (location.rent > 0 && budget > 0) {
    // Reward being under budget, penalise going over
    const ratio = location.rent / budget;
    if (ratio <= 1) {
      // Under budget: linear reward + bonus for being well under
      budgetScore = clamp((1 - ratio) * 1.4, 0, 1) * 28;
    } else {
      // Over budget: steep penalty
      budgetScore = 0;
    }
  }

  // Commute score — exponential decay, neutral if not loaded
  let commuteScore = 13;
  const decay = commuteDecay(location.commute, maxCommute);
  if (decay !== null) {
    commuteScore = clamp(decay, 0, 1) * 27;
  }

  const safetyScore    = (location.safety    / 10) * 18;
  const amenitiesScore = (location.amenities / 10) * 12;
  const transitScore   = (location.transit   / 10) * 8;

  let lifestyleScore = 0;
  if (household === "Family")   lifestyleScore = (location.familyFriendly  / 10) * 7;
  if (household === "Couple")   lifestyleScore = (location.coupleFriendly  / 10) * 7;
  if (household === "Student")  lifestyleScore = (location.studentFriendly / 10) * 7;
  if (household === "Balanced") {
    // Average of all three lifestyle scores — no household bias
    lifestyleScore = (
      (location.familyFriendly + location.coupleFriendly + location.studentFriendly) / 30
    ) * 7;
  }

  const raw = budgetScore + commuteScore + safetyScore + amenitiesScore + transitScore + lifestyleScore;
  return Math.min(99, Math.round(raw));
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
    if (location.commute <= 15)
      lines.push(`very short commute — just ${location.commute} min`);
    else if (location.commute <= maxCommute * 0.5)
      lines.push(`comfortable ${location.commute}-min commute`);
    else
      lines.push(`${location.commute}-min commute within your limit`);
  }

  if (location.rent > 0) {
    const savings = maxBudget - location.rent;
    if (savings >= 8000)       lines.push(`₹${savings.toLocaleString()} under your budget`);
    else if (savings >= 2000)  lines.push(`rent fits your budget`);
  }

  if (location.safety >= 9)      lines.push("excellent safety score");
  else if (location.safety >= 8) lines.push("good safety");

  if (household === "Family"  && location.familyFriendly  >= 8) lines.push("highly family-friendly");
  if (household === "Couple"  && location.coupleFriendly  >= 8) lines.push("great for couples");
  if (household === "Student" && location.studentFriendly >= 8) lines.push("popular with students");

  if (location.amenities >= 8)           lines.push("great amenities nearby");
  else if (location.liveData?.food > 15) lines.push("excellent food & café scene");

  return lines.slice(0, 3).join(" · ") || "best overall match for your criteria";
}
