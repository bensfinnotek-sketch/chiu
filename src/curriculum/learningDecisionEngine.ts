export type RecommendationDecision = 'review_srs' | 'review_quiz' | 'learn_lesson' | 'advance_hsk';

export interface RecommendationDecisionInput {
  masteryScore: number;
  vocabularyScore: number;
  grammarScore: number;
  quizScore: number;
  quizAttempts: number;
  weakVocabularyCount: number;
  weakGrammarCount: number;
  completionPercent: number;
  currentLevel: HSKLevelNumber;
  dueCardCount: number;
  highPriorityDueCards: number;
}

export interface RecommendationDecisionResult {
  decision: RecommendationDecision;
  priority: number;
  reason: string;
}

export function decideLearningNextStep(input: RecommendationDecisionInput): RecommendationDecisionResult {
  const masteryReady =
    input.completionPercent >= 100 &&
    input.masteryScore >= 80 &&
    input.vocabularyScore >= 70 &&
    input.grammarScore >= 70 &&
    (input.quizAttempts === 0 || input.quizScore >= 80) &&
    input.weakVocabularyCount <= 5 &&
    input.weakGrammarCount <= 2;

  if (input.highPriorityDueCards > 0 || input.dueCardCount > 0) {
    return { decision: 'review_srs', priority: 1, reason: 'Có flashcards đến hạn hoặc đang có mức ưu tiên ôn cao.' };
  }

  if (masteryReady && input.currentLevel < 6) {
    return { decision: 'advance_hsk', priority: 0, reason: 'Không còn SRS cần ưu tiên và HSK hiện tại đã đủ completion + mastery để chuyển cấp.' };
  }

  if (
    (input.quizAttempts > 0 && input.quizScore < 80) ||
    input.weakGrammarCount > 0
  ) {
    return { decision: 'review_quiz', priority: 2, reason: 'Quiz hoặc ngữ pháp còn điểm yếu cần củng cố.' };
  }

  if (
    input.completionPercent < 100 ||
    input.masteryScore < 70 ||
    input.vocabularyScore < 65 ||
    input.grammarScore < 65
  ) {
    return { decision: 'learn_lesson', priority: 3, reason: 'Mastery chưa đủ để chuyển sang nội dung mới ở mức tiếp theo.' };
  }

  return { decision: 'learn_lesson', priority: 3, reason: 'Tiếp tục bài học mới để duy trì tiến độ.' };
}

