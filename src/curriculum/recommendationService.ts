import {
  HSKLevelNumber,
  Lesson,
  UserLessonProgress,
  LearningRecommendation,
  HSKLevelCompletion,
} from '../types/curriculum';
import { curriculumRepository } from './curriculumRepository';
import { LessonProgressRepository } from './lessonProgressRepository';
import { ALL_GRAMMAR_POINTS } from './vocabularyAndGrammarData';
import { buildHskMasteryProfile, getHskMasteryProfile } from './masteryProfile';

export class RecommendationService {
  async getNextLessonToStudy(
    userId: string,
    currentLevelNumber: HSKLevelNumber,
    repo: LessonProgressRepository
  ): Promise<Lesson | null> {
    const allLessons = await curriculumRepository.getAllLessons();
    const levelLessons = allLessons
      .filter((l) => l.levelNumber === currentLevelNumber)
      .sort((a, b) => a.order - b.order);

    const userProgressList = await repo.getProgress(userId);
    const progressMap = new Map<string, UserLessonProgress>();
    userProgressList.forEach((p) => progressMap.set(p.lessonId, p));

    // Rule 1: First check if any lesson is currently 'in_progress'
    const inProgress = levelLessons.find((l) => {
      const p = progressMap.get(l.id);
      return p?.status === 'in_progress';
    });
    if (inProgress) return inProgress;

    // Rule 2: First available incomplete lesson
    for (const lesson of levelLessons) {
      const p = progressMap.get(lesson.id);
      if (!p || p.status !== 'completed') {
        // Check prerequisite
        if (!lesson.prerequisiteLessonId) {
          return lesson;
        }
        const prereqProgress = progressMap.get(lesson.prerequisiteLessonId);
        if (prereqProgress && prereqProgress.status === 'completed') {
          return lesson;
        }
      }
    }

    // Rule 3: If every lesson is complete, revisit the lowest-scoring lesson
    // instead of looping back to the first lesson without context.
    const completed = levelLessons
      .map((lesson) => ({ lesson, progress: progressMap.get(lesson.id) }))
      .filter(({ progress }) => progress?.status === 'completed')
      .sort((a, b) => (a.progress?.score ?? 100) - (b.progress?.score ?? 100));

    return completed[0]?.lesson || levelLessons[0] || null;
  }

  async getRecommendations(
    userId: string,
    currentLevelNumber: HSKLevelNumber,
    repo: LessonProgressRepository
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    const nextLesson = await this.getNextLessonToStudy(userId, currentLevelNumber, repo);
    const levelCompletion = await this.calculateLevelCompletion(userId, currentLevelNumber, repo);

    if (nextLesson && levelCompletion.completionPercent < 100) {
      const userProgress = await repo.getLessonProgress(userId, nextLesson.id);
      const isResume = userProgress?.status === 'in_progress';

      const isCompletedReview = userProgress?.status === 'completed';
      recommendations.push({
        type: isCompletedReview ? 'retry_quiz' : isResume ? 'continue_lesson' : 'next_lesson',
        title: isCompletedReview
          ? `Củng cố bài cần ôn: ${nextLesson.title}`
          : isResume
            ? `Tiếp tục bài học: ${nextLesson.title}`
            : `Bài học tiếp theo: ${nextLesson.title}`,
        description: isCompletedReview
          ? `Điểm tốt nhất ${userProgress?.score ?? 0}% · ${nextLesson.titleZh}`
          : `${nextLesson.titleZh} · Dự kiến ${nextLesson.estimatedMinutes} phút`,
        targetId: nextLesson.id,
        priority: 3,
        actionText: isCompletedReview ? 'Ôn lại bài' : isResume ? 'Học tiếp ngay' : 'Bắt đầu học',
        metadata: { levelNumber: nextLesson.levelNumber, score: userProgress?.score ?? undefined },
      });
    }

    // Prefer a quiz retry when a completed lesson has a weak score.
    const allLessons = await curriculumRepository.getAllLessons();
    const levelLessons = allLessons.filter((lesson) => lesson.levelNumber === currentLevelNumber);
    const progressList = await repo.getProgress(userId);
    const weakCompleted = levelLessons
      .map((lesson) => ({ lesson, progress: progressList.find((p) => p.lessonId === lesson.id) }))
      .filter(({ progress }) => progress?.status === 'completed' && (progress.score ?? 100) < 80)
      .sort((a, b) => (a.progress?.score ?? 100) - (b.progress?.score ?? 100))[0];

    if (weakCompleted) {
      recommendations.push({
        type: 'retry_quiz',
        title: `Ôn lại bài kiểm tra: ${weakCompleted.lesson.title}`,
        description: `Điểm tốt nhất hiện tại ${weakCompleted.progress?.score ?? 0}%. Hãy luyện lại để củng cố kiến thức.`,
        targetId: weakCompleted.lesson.id,
        priority: 2,
        actionText: 'Luyện lại',
        metadata: {
          levelNumber: weakCompleted.lesson.levelNumber,
          score: weakCompleted.progress?.score ?? 0,
        },
      });
    }

    // Mastery profile is the main decision signal. It combines repeated
    // vocabulary/grammar evidence with quiz performance for this HSK level.
    const [skillProgress, vocabProgress, grammarProgress] = await Promise.all([
      repo.getSkillProgress(userId),
      repo.getVocabularyProgress(userId),
      repo.getGrammarProgress(userId),
    ]);

    const [allVocabulary, allGrammar, allLessons] = await Promise.all([
      curriculumRepository.getAllVocabulary(),
      Promise.resolve(ALL_GRAMMAR_POINTS),
      curriculumRepository.getAllLessons(),
    ]);
    const lessonLevels = new Map(allLessons.map((lesson) => [lesson.id, lesson.levelNumber]));
    const vocabularyLevels = new Map(allVocabulary.map((vocab) => [vocab.id, vocab.hskLevel]));
    const grammarLevels = new Map(allGrammar.map((grammar) => [grammar.id, grammar.level]));

    const quizAttempts = (
      await Promise.all(
        allLessons
          .filter((lesson) => lesson.levelNumber === currentLevelNumber)
          .map((lesson) => repo.getQuizAttempts(userId, lesson.id))
      )
    ).flat();

    const masteryProfiles = buildHskMasteryProfile({
      vocabulary: vocabProgress,
      grammar: grammarProgress,
      quizAttempts,
      skillProgress,
      vocabularyLevels,
      grammarLevels,
      lessonLevels,
    });
    const currentMastery = getHskMasteryProfile(masteryProfiles, currentLevelNumber);

    // HSK progression now requires both curriculum completion and real mastery.
    // A missing quiz is allowed for learners who have not reached assessment yet,
    // but once quizzes exist they must also meet the assessment threshold.
    const quizReady = currentMastery.quizAttempts === 0 || currentMastery.quizScore >= 80;
    const masteryReady =
      currentMastery.overallScore >= 80 &&
      currentMastery.vocabularyScore >= 70 &&
      currentMastery.grammarScore >= 70 &&
      quizReady &&
      currentMastery.weakVocabularyCount <= 5 &&
      currentMastery.weakGrammarCount <= 2;

    if (
      levelCompletion.completionPercent >= 100 &&
      masteryReady &&
      currentLevelNumber < 6
    ) {
      const nextLevel = (currentLevelNumber + 1) as HSKLevelNumber;
      recommendations.push({
        type: 'next_lesson',
        title: `Đã hoàn thành HSK ${currentLevelNumber} · sẵn sàng lên HSK ${nextLevel}`,
        description: `Mastery ${currentMastery.overallScore}/100 · Vocabulary ${currentMastery.vocabularyScore} · Grammar ${currentMastery.grammarScore}${currentMastery.quizAttempts > 0 ? ` · Quiz ${currentMastery.quizScore}` : ''}. Đủ điều kiện chuyển cấp.`,
        targetId: `level:${nextLevel}`,
        priority: 0,
        actionText: `Học HSK ${nextLevel}`,
        metadata: { levelNumber: nextLevel, score: currentMastery.overallScore },
      });
    }

    // Weakest component of the current HSK has priority over generic
    // "learn something new" suggestions.
    const componentScores = [
      { key: 'vocabulary' as const, score: currentMastery.vocabularyScore },
      { key: 'grammar' as const, score: currentMastery.grammarScore },
      { key: 'quiz' as const, score: currentMastery.quizScore },
    ].sort((a, b) => a.score - b.score);
    const weakestComponent = componentScores[0];

    if (weakestComponent.key === 'vocabulary' && currentMastery.weakVocabularyCount > 0) {
      recommendations.push({
        type: 'review_vocabulary',
        title: `Ôn ${currentMastery.weakVocabularyCount} từ vựng yếu ở HSK ${currentLevelNumber}`,
        description: `Vocabulary ${currentMastery.vocabularyScore}/100. Daily Review sẽ kết hợp điểm yếu với lịch SRS để chọn thẻ cần ôn trước.`,
        targetId: 'flashcards',
        priority: 1,
        actionText: 'Ôn flashcards',
        metadata: {
          levelNumber: currentLevelNumber,
          score: currentMastery.vocabularyScore,
          wordCount: currentMastery.weakVocabularyCount,
        },
      });
    }

    if (weakestComponent.key === 'grammar' && currentMastery.weakGrammarCount > 0) {
      recommendations.push({
        type: 'review_grammar',
        title: `Củng cố ${currentMastery.weakGrammarCount} điểm ngữ pháp yếu`,
        description: `Grammar ${currentMastery.grammarScore}/100. Ưu tiên ôn cấu trúc trước khi mở rộng nội dung mới.`,
        targetId: 'grammar',
        priority: 1,
        actionText: 'Ôn ngữ pháp',
        metadata: { levelNumber: currentLevelNumber, score: currentMastery.grammarScore },
      });
    }

    if (weakestComponent.key === 'quiz' && currentMastery.quizAttempts > 0 && currentMastery.quizScore < 80) {
      const weakQuiz = levelLessons
        .map((lesson) => ({
          lesson,
          score: quizAttempts
            .filter((attempt) => attempt.lessonId === lesson.id)
            .reduce((best, attempt) => Math.max(best, attempt.score), 0),
        }))
        .filter((item) => item.score > 0 && item.score < 80)
        .sort((a, b) => a.score - b.score)[0];

      if (weakQuiz) {
        recommendations.push({
          type: 'retry_quiz',
          title: `Luyện lại quiz: ${weakQuiz.lesson.title}`,
          description: `Điểm quiz HSK ${currentLevelNumber} đang ở ${currentMastery.quizScore}/100. Ôn lại bài kiểm tra để củng cố điểm yếu.`,
          targetId: weakQuiz.lesson.id,
          priority: 1,
          actionText: 'Luyện lại',
          metadata: { levelNumber: currentLevelNumber, score: weakQuiz.score },
        });
      }
    }

    // Fallback: if the profile has no weak component with actionable evidence,
    // continue the curriculum. This keeps new learners moving forward.
    if (recommendations.length === 0 && nextLesson && levelCompletion.completionPercent < 100) {
      const userProgress = await repo.getLessonProgress(userId, nextLesson.id);
      recommendations.push({
        type: userProgress?.status === 'in_progress' ? 'continue_lesson' : 'next_lesson',
        title: userProgress?.status === 'in_progress'
          ? `Tiếp tục bài học: ${nextLesson.title}`
          : `Bài học tiếp theo: ${nextLesson.title}`,
        description: `HSK ${currentLevelNumber} hiện ở ${currentMastery.overallScore}/100 (${currentMastery.vocabularyScore} từ vựng · ${currentMastery.grammarScore} ngữ pháp · ${currentMastery.quizScore} quiz).`,
        targetId: nextLesson.id,
        priority: 2,
        actionText: userProgress?.status === 'in_progress' ? 'Học tiếp' : 'Bắt đầu học',
        metadata: { levelNumber: currentLevelNumber, score: currentMastery.overallScore },
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  async calculateLevelCompletion(
    userId: string,
    levelNumber: HSKLevelNumber,
    repo: LessonProgressRepository
  ): Promise<HSKLevelCompletion> {
    const allLessons = await curriculumRepository.getAllLessons();
    const levelLessons = allLessons.filter((l) => l.levelNumber === levelNumber);
    const requiredLessons = levelLessons.filter((l) => l.isRequired);

    const userProgressList = await repo.getProgress(userId);
    const progressMap = new Map<string, UserLessonProgress>();
    userProgressList.forEach((p) => progressMap.set(p.lessonId, p));

    let completedCount = 0;
    let totalScore = 0;
    let scoredLessonsCount = 0;

    for (const l of requiredLessons) {
      const p = progressMap.get(l.id);
      if (p && p.status === 'completed') {
        completedCount++;
        if (p.score !== undefined && p.score !== null) {
          totalScore += p.score;
          scoredLessonsCount++;
        }
      }
    }

    const totalRequired = Math.max(requiredLessons.length, 1);
    const percent = Math.min(100, Math.round((completedCount / totalRequired) * 100));
    const avgScore = scoredLessonsCount > 0 ? Math.round(totalScore / scoredLessonsCount) : 0;

    const [vocabProgress, grammarProgress, skillProgress] = await Promise.all([
      repo.getVocabularyProgress(userId),
      repo.getGrammarProgress(userId),
      repo.getSkillProgress(userId),
    ]);
    const lessonLevels = new Map(allLessons.map((lesson) => [lesson.id, lesson.levelNumber]));
    const allVocabulary = await curriculumRepository.getAllVocabulary();
    const vocabularyLevels = new Map(allVocabulary.map((item) => [item.id, item.hskLevel]));
    const grammarLevels = new Map(ALL_GRAMMAR_POINTS.map((item) => [item.id, item.level]));
    const quizAttempts = (
      await Promise.all(levelLessons.map((lesson) => repo.getQuizAttempts(userId, lesson.id)))
    ).flat();
    const profile = getHskMasteryProfile(
      buildHskMasteryProfile({
        vocabulary: vocabProgress,
        grammar: grammarProgress,
        quizAttempts,
        skillProgress,
        vocabularyLevels,
        grammarLevels,
        lessonLevels,
      }),
      levelNumber
    );

    return {
      userId,
      level: levelNumber,
      completionPercent: percent,
      completedLessons: completedCount,
      totalRequiredLessons: totalRequired,
      averageQuizScore: avgScore,
      masteryScore: profile.overallScore,
      vocabularyMastery: profile.vocabularyScore,
      grammarMastery: profile.grammarScore,
      quizMastery: profile.quizScore,
      weakVocabularyCount: profile.weakVocabularyCount,
      weakGrammarCount: profile.weakGrammarCount,
      completedAt: percent >= 100 ? new Date().toISOString() : null,
    };
  }
}

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

  if (masteryReady && input.currentLevel < 6) {
    return { decision: 'advance_hsk', priority: 0, reason: 'HSK hiện tại đã đủ completion và mastery để chuyển cấp.' };
  }

  if (input.highPriorityDueCards > 0 || input.dueCardCount > 0) {
    return { decision: 'review_srs', priority: 1, reason: 'Có flashcards đến hạn hoặc đang có mức ưu tiên ôn cao.' };
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

export const recommendationService = new RecommendationService();
