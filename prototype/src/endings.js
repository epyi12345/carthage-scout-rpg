export function evaluateEnding(summary) {
  if (!summary.survived) return 'catastrophe';
  if (summary.mapQuality >= 90 && summary.returnDay <= 14) return 'decisive_victory';
  if (summary.mapQuality >= 70) return 'hard_won_victory';
  if (summary.settled) return 'settlement';
  return 'defeat';
}
