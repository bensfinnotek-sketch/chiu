export type SrsRating = 'correct' | 'incorrect';

export interface SrsSchedule {
  status: 'learning' | 'learned';
  reviewCount: number;
  lastReviewedAt: string;
  nextReviewAt: string;
  intervalMinutes: number;
}

/**
 * Lightweight deterministic SRS for vocabulary review.
 * Incorrect answers bring the card back quickly; repeated correct answers
 * expand the interval progressively. This is intentionally not presented as
 * a full SM-2 implementation.
 */
export function calculateSrsSchedule(
  current: {
    status: 'new' | 'learning' | 'learned';
    reviewCount: number;
    nextReviewAt?: string;
  },
  rating: SrsRating,
  now = new Date()
): SrsSchedule {
  const reviewCount = Math.max(0, Math.floor(current.reviewCount || 0)) + 1;
  const lastReviewedAt = now.toISOString();

  if (rating === 'incorrect') {
    // Retry after 10 minutes, then keep failed cards in learning until a
    // successful review starts rebuilding the interval.
    const intervalMinutes = reviewCount <= 1 ? 10 : reviewCount <= 3 ? 20 : 30;
    return {
      status: 'learning',
      reviewCount,
      lastReviewedAt,
      nextReviewAt: new Date(now.getTime() + intervalMinutes * 60_000).toISOString(),
      intervalMinutes,
    };
  }

  // Correct: 1d -> 3d -> 7d -> 14d -> 30d -> 60d.
  const intervalsMinutes = [24 * 60, 3 * 24 * 60, 7 * 24 * 60, 14 * 24 * 60, 30 * 24 * 60, 60 * 24 * 60];
  const intervalMinutes = intervalsMinutes[Math.min(reviewCount - 1, intervalsMinutes.length - 1)];

  return {
    status: 'learned',
    reviewCount,
    lastReviewedAt,
    nextReviewAt: new Date(now.getTime() + intervalMinutes * 60_000).toISOString(),
    intervalMinutes,
  };
}
