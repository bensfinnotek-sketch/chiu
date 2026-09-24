export function calculateVocabularyMasteryScore(input: {
  exposureCount: number;
  correctCount: number;
  incorrectCount: number;
  lastSeenAt?: string | null;
  status?: UserVocabularyProgress['status'];
}, now = new Date()): number {
  const exposure = Math.max(0, Math.floor(input.exposureCount || 0));
  if (exposure === 0) return 0;

  const correct = Math.max(0, Math.floor(input.correctCount || 0));
  const incorrect = Math.max(0, Math.floor(input.incorrectCount || 0));
  const accuracy = Math.max(0, Math.min(100, (correct / exposure) * 100));

  // Confidence grows with repeated exposure, while recent mistakes and long
  // inactivity pull the score down. This keeps mastery interpretable as 0-100.
  const confidence = Math.min(20, exposure * 4);
  const errorPenalty = Math.min(25, incorrect * 5);
  const daysSinceSeen = input.lastSeenAt
    ? Math.max(0, (now.getTime() - Date.parse(input.lastSeenAt)) / 86_400_000)
    : 30;
  const recencyPenalty = Math.min(20, daysSinceSeen * 0.8);
  const masteredBonus = input.status === 'mastered' ? 10 : 0;

  return Math.round(
    Math.max(0, Math.min(100, accuracy * 0.65 + confidence + masteredBonus - errorPenalty - recencyPenalty))
  );
}
