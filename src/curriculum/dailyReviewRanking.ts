export interface DailyReviewCardInput {
  nextReviewAt?: string | null;
  status: 'new' | 'learning' | 'learned';
  hskLevel?: number | null;
  masteryScore?: number | null;
  incorrectCount?: number;
  repetitions?: number;
  createdAt?: string;
  now?: number;
  currentHskLevel?: number | null;
  currentHskVocabularyScore?: number | null;
}

export interface DailyReviewPriority {
  score: number;
  reason: string;
  overdueHours: number;
  masteryScore: number;
}

export function getDailyReviewPriority(card: DailyReviewCardInput): DailyReviewPriority {
  const now = card.now ?? Date.now();
  const dueAt = card.nextReviewAt ? Date.parse(card.nextReviewAt) : Number.NaN;
  const hasSchedule = Number.isFinite(dueAt);
  const overdueHours = hasSchedule ? Math.max(0, (now - dueAt) / 3_600_000) : 0;
  const masteryScore = Math.max(0, Math.min(100, card.masteryScore ?? 50));
  const weakness = 100 - masteryScore;
  const incorrectHistory = Math.min(40, Math.max(0, card.incorrectCount || 0) * 8);
  const repetitionPenalty = Math.max(0, 6 - Math.max(0, card.repetitions || 0)) * 2;
  const newCardBoost = !hasSchedule ? 12 : 0;
  const learningBoost = card.status === 'learning' ? 10 : card.status === 'new' ? 6 : 0;
  const hskMatch = card.currentHskLevel && card.hskLevel === card.currentHskLevel ? 8 : 0;
  const skillWeakness = card.currentHskVocabularyScore != null
    ? Math.max(0, 100 - card.currentHskVocabularyScore) * 0.35
    : 0;
  const score = overdueHours * 3 + weakness * 1.35 + incorrectHistory + repetitionPenalty + newCardBoost + learningBoost + hskMatch + skillWeakness;
  const reasons: string[] = [];
  if (overdueHours >= 1) reasons.push('quá hạn ' + Math.round(overdueHours) + 'h');
  if (masteryScore < 60) reasons.push('mastery ' + Math.round(masteryScore));
  if ((card.incorrectCount || 0) > 0) reasons.push('sai ' + card.incorrectCount + ' lần');
  if (card.status === 'learning') reasons.push('đang học');
  if (reasons.length === 0) reasons.push('đến lượt ôn theo SRS');
  return { score, reason: reasons.slice(0, 3).join(' · '), overdueHours, masteryScore };
}