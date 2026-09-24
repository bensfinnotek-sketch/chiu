export type PlanTier = 'free' | 'premium';

export interface PlanEntitlements {
  maxHskLevel: 1 | 2 | 3 | 4 | 5 | 6;
  dailyAutoFlashcardLimit: number | null;
  personalizedCurriculum: boolean;
  advancedHskLevels: boolean;
}

export const PLAN_ENTITLEMENTS: Record<PlanTier, PlanEntitlements> = {
  free: {
    maxHskLevel: 2,
    dailyAutoFlashcardLimit: 10,
    personalizedCurriculum: true,
    advancedHskLevels: false,
  },
  premium: {
    maxHskLevel: 6,
    dailyAutoFlashcardLimit: null,
    personalizedCurriculum: true,
    advancedHskLevels: true,
  },
};

export function normalizePlan(plan: unknown): PlanTier {
  return plan === 'premium' ? 'premium' : 'free';
}
