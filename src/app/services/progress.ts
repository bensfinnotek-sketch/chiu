import type { UserProfile } from '../types';
import type { ReviewType } from '../learning/types';
import { learningEngine } from '../learning/engine';

export interface ProgressService {
  state(): ReturnType<typeof learningEngine.getState>;
  startLesson(lessonId: string): void;
  getLesson(id: string): ReturnType<typeof learningEngine.getLesson>;
  dueReviews(limit?: number): ReturnType<typeof learningEngine.dueReviews>;
  reviewTypes(): ReturnType<typeof learningEngine.reviewTypes>;
  weakAreas(): ReturnType<typeof learningEngine.weakAreas>;
  completeSection(lessonId: string, section: ReviewType | 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'roleplay' | 'review'): ReturnType<typeof learningEngine.getState>['progress'];
  review(vocabularyId: string, rating: 'again' | 'hard' | 'good' | 'easy'): ReturnType<typeof learningEngine.review>;
  recordMistake(type: Parameters<typeof learningEngine.recordMistake>[0], original: string, corrected: string, explanation: string): ReturnType<typeof learningEngine.recordMistake>;
  dailyPlan(profile: UserProfile): ReturnType<typeof learningEngine.dailyPlan>;
  reset(): void;
}

export const progressService: ProgressService = {
  state: () => learningEngine.getState(),
  startLesson: lessonId => learningEngine.startLesson(lessonId),
  getLesson: id => learningEngine.getLesson(id),
  dueReviews: limit => learningEngine.dueReviews(limit),
  reviewTypes: () => learningEngine.reviewTypes(),
  weakAreas: () => learningEngine.weakAreas(),
  completeSection: (lessonId, section) => learningEngine.completeSection(lessonId, section),
  review: (vocabularyId, rating) => learningEngine.review(vocabularyId, rating),
  recordMistake: (type, original, corrected, explanation) => learningEngine.recordMistake(type, original, corrected, explanation),
  dailyPlan: profile => learningEngine.dailyPlan(profile),
  reset: () => learningEngine.resetProgress(),
};