export type SrsRating = 'correct' | 'incorrect';

export interface SrsSchedule {
  status: 'learning' | 'learned';
  reviewCount: number;
  repetitions: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: string;
  nextReviewAt: string;
  intervalMinutes: number;
}

/**
 * Lightweight deterministic SRS for vocabulary review.
 * A wrong answer resets the successful repetition streak and schedules a
 * short retry. Correct answers rebuild the interval progressively.
 */
export function calculateSrsSchedule(
  current: {
    status: 'new' | 'learning' | 'learned';
    reviewCount: number;
    srsRepetitions?: number;
    srsCorrectCount?: number;
    srsIncorrectCount?: number;
  },
  rating: SrsRating,
  now = new Date()
): SrsSchedule {
  const reviewCount = Math.max(0, Math.floor(current.reviewCount || 0)) + 1;
  const previousRepetitions = Math.max(0, Math.floor(current.srsRepetitions || 0));
  const correctCount = Math.max(0, Math.floor(current.srsCorrectCount || 0)) + (rating === 'correct' ? 1 : 0);
  const incorrectCount = Math.max(0, Math.floor(current.srsIncorrectCount || 0)) + (rating === 'incorrect' ? 1 : 0);
  const lastReviewedAt = now.toISOString();

  if (rating === 'incorrect') {
    const intervalMinutes = incorrectCount <= 1 ? 10 : incorrectCount <= 3 ? 20 : 30;
    return {
      status: 'learning',
      reviewCount,
      repetitions: 0,
      correctCount,
      incorrectCount,
      lastReviewedAt,
      nextReviewAt: new Date(now.getTime() + intervalMinutes * 60_000).toISOString(),
      intervalMinutes,
    };
  }

  const repetitions = previousRepetitions + 1;
  const intervalsMinutes = [
    24 * 60,
    3 * 24 * 60,
    7 * 24 * 60,
    14 * 24 * 60,
    30 * 24 * 60,
    60 * 24 * 60,
  ];
  const intervalMinutes = intervalsMinutes[Math.min(repetitions - 1, intervalsMinutes.length - 1)];

  return {
    status: 'learned',
    reviewCount,
    repetitions,
    correctCount,
    incorrectCount,
    lastReviewedAt,
    nextReviewAt: new Date(now.getTime() + intervalMinutes * 60_000).toISOString(),
    intervalMinutes,
  };
}
