const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function calculateMatchScore(location, preferences) {
  const budget = Number(preferences?.budget || 20000);
  const maxCommute = Number(preferences?.maxCommute || 45);
  const household = preferences?.household || "Student";

  const budgetScore = budget > 0 ? clamp(1 - location.rent / budget, 0, 1) * 30 : 0;
  const commuteScore = maxCommute > 0 ? clamp(1 - location.commute / maxCommute, 0, 1) * 25 : 0;
  const safetyScore = (location.safety / 10) * 20;
  const transitScore = (location.transit / 10) * 10;
  const amenitiesScore = (location.amenities / 10) * 10;

  let lifestyleScore = 0;
  if (household === "Family") lifestyleScore = (location.familyFriendly / 10) * 5;
  if (household === "Couple") lifestyleScore = (location.coupleFriendly / 10) * 5;
  if (household === "Student") lifestyleScore = (location.studentFriendly / 10) * 5;

  return Math.round(budgetScore + commuteScore + safetyScore + transitScore + amenitiesScore + lifestyleScore);
}
