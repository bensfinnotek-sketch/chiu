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
import { flashcardService } from '../services/flashcardService';
import { getDailyReviewPriority } from './dailyReviewRanking';
import { decideLearningNextStep } from './learningDecisionEngine';

interface RecommendationDataSnapshot {
  allLessons: Lesson[];
  userProgressList: UserLessonProgress[];
  vocabularyLevels?: Map<string, HSKLevelNumber>;
  grammarLevels?: Map<string, HSKLevelNumber>;
  vocabularyProgress?: Awaited<ReturnType<LessonProgressRepository['getVocabularyProgress']>>;
  grammarProgress?: Awaited<ReturnType<LessonProgressRepository['getGrammarProgress']>>;
  skillProgress?: Awaited<ReturnType<LessonProgressRepository['getSkillProgress']>>;
  quizAttempts?: import('../types/curriculum').QuizAttempt[];
}

export class RecommendationService {
  private findNextLesson(
    currentLevelNumber: HSKLevelNumber,
    allLessons: Lesson[],
    userProgressList: UserLessonProgress[]
  ): Lesson | null {
    const levelLessons = allLessons
      .filter((l) => l.levelNumber === currentLevelNumber)
      .sort((a, b) => a.order - b.order);
    const progressMap = new Map<string, UserLessonProgress>();
    userProgressList.forEach((p) => progressMap.set(p.lessonId, p));

    const inProgress = levelLessons.find((l) => progressMap.get(l.id)?.status === 'in_progress');
    if (inProgress) return inProgress;

    for (const lesson of levelLessons) {
      const p = progressMap.get(lesson.id);
      if (!p || p.status !== 'completed') {
        if (!lesson.prerequisiteLessonId || progressMap.get(lesson.prerequisiteLessonId)?.status === 'completed') {
          return lesson;
        }
      }
    }

    return levelLessons
      .map((lesson) => ({ lesson, progress: progressMap.get(lesson.id) }))
      .filter(({ progress }) => progress?.status === 'completed')
      .sort((a, b) => (a.progress?.score ?? 100) - (b.progress?.score ?? 100))[0]?.lesson
      || levelLessons[0]
      || null;
  }

  async getNextLessonToStudy(
    userId: string,
    currentLevelNumber: HSKLevelNumber,
    repo: LessonProgressRepository
  ): Promise<Lesson | null> {
    const [allLessons, userProgressList] = await Promise.all([
      curriculumRepository.getAllLessons(),
      repo.getProgress(userId),
    ]);
    return this.findNextLesson(currentLevelNumber, allLessons, userProgressList);
  }

  async getRecommendations(
    userId: string,
    currentLevelNumber: HSKLevelNumber,
    repo: LessonProgressRepository
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    const [allLessons, userProgressList, skillProgress, vocabProgress, grammarProgress, allVocabulary] = await Promise.all([
      curriculumRepository.getAllLessons(),
      repo.getProgress(userId),
      repo.getSkillProgress(userId),
      repo.getVocabularyProgress(userId),
      repo.getGrammarProgress(userId),
      curriculumRepository.getAllVocabulary(),
    ]);
    const allGrammar = ALL_GRAMMAR_POINTS;
    const nextLesson = this.findNextLesson(currentLevelNumber, allLessons, userProgressList);

    // Mastery profile is the main decision signal. It combines repeated
    // vocabulary/grammar evidence with quiz performance for this HSK level.
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
    const levelCompletion = await this.calculateLevelCompletion(userId, currentLevelNumber, repo, {
      allLessons,
      userProgressList,
      vocabularyLevels,
      grammarLevels,
      vocabularyProgress: vocabProgress,
      grammarProgress,
      skillProgress,
    });

    // One decision engine now coordinates SRS, quiz/grammar reinforcement,
    // lesson progression, and HSK advancement.
    const flashcards = await flashcardService.getFlashcards();
    const now = Date.now();
    const dueCards = flashcards.filter((card) => {
      if (!card.next_review_at) return true;
      const dueAt = Date.parse(card.next_review_at);
      return Number.isFinite(dueAt) && dueAt <= now;
    });
    const rankedDueCards = dueCards
      .map((card) => ({
        card,
        priority: getDailyReviewPriority({
          nextReviewAt: card.next_review_at,
          status: card.status,
          hskLevel: card.hsk_level,
          incorrectCount: card.srs_incorrect_count,
          repetitions: card.srs_repetitions,
          currentHskLevel: currentLevelNumber,
          currentHskVocabularyScore: currentMastery.vocabularyScore,
          now,
        }),
      }))
      .sort((a, b) => b.priority.score - a.priority.score);
    const decision = decideLearningNextStep({
      masteryScore: currentMastery.overallScore,
      vocabularyScore: currentMastery.vocabularyScore,
      grammarScore: currentMastery.grammarScore,
      quizScore: currentMastery.quizScore,
      quizAttempts: currentMastery.quizAttempts,
      weakVocabularyCount: currentMastery.weakVocabularyCount,
      weakGrammarCount: currentMastery.weakGrammarCount,
      completionPercent: levelCompletion.completionPercent,
      currentLevel: currentLevelNumber,
      dueCardCount: dueCards.length,
      highPriorityDueCards: rankedDueCards.filter((item) => item.priority.score >= 70).length,
    });

    // Route lesson and quiz recommendations only after the unified decision is known.
    // This prevents lower-priority suggestions from conflicting with SRS/HSK decisions.
    if (decision.decision === 'learn_lesson' && nextLesson && levelCompletion.completionPercent < 100) {
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
        priority: decision.priority,
        actionText: isCompletedReview ? 'Ôn lại bài' : isResume ? 'Học tiếp ngay' : 'Bắt đầu học',
        metadata: {
          levelNumber: nextLesson.levelNumber,
          score: userProgress?.score ?? undefined,
          decision: decision.decision,
          reason: decision.reason,
        },
      });
    }

    if (decision.decision === 'review_srs' && dueCards.length > 0) {
      recommendations.push({
        type: 'review_vocabulary',
        title: `Ôn SRS trước: ${dueCards.length} flashcards đang đến hạn`,
        description: `${decision.reason} Daily Review sẽ ưu tiên các thẻ yếu, sai nhiều và quá hạn trước.`,
        targetId: 'flashcards',
        priority: decision.priority,
        actionText: 'Ôn ngay',
        metadata: {
          levelNumber: currentLevelNumber,
          score: currentMastery.vocabularyScore,
          wordCount: dueCards.length,
          decision: decision.decision,
          reason: decision.reason,
        },
      });
    }

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
      decision.decision === 'advance_hsk' &&
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
        metadata: {
          levelNumber: nextLevel,
          score: currentMastery.overallScore,
          decision: decision.decision,
          reason: decision.reason,
        },
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

    if (decision.decision === 'review_quiz' && weakestComponent.key === 'vocabulary' && currentMastery.weakVocabularyCount > 0) {
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
          decision: decision.decision,
          reason: decision.reason,
        },
      });
    }

    if (decision.decision === 'review_quiz' && weakestComponent.key === 'grammar' && currentMastery.weakGrammarCount > 0) {
      recommendations.push({
        type: 'review_grammar',
        title: `Củng cố ${currentMastery.weakGrammarCount} điểm ngữ pháp yếu`,
        description: `Grammar ${currentMastery.grammarScore}/100. Ưu tiên ôn cấu trúc trước khi mở rộng nội dung mới.`,
        targetId: 'grammar',
        priority: 1,
        actionText: 'Ôn ngữ pháp',
        metadata: {
          levelNumber: currentLevelNumber,
          score: currentMastery.grammarScore,
          decision: decision.decision,
          reason: decision.reason,
        },
      });
    }

    if (decision.decision === 'review_quiz' && weakestComponent.key === 'quiz' && currentMastery.quizAttempts > 0 && currentMastery.quizScore < 80) {
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
          metadata: {
            levelNumber: currentLevelNumber,
            score: weakQuiz.score,
            decision: decision.decision,
            reason: decision.reason,
          },
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
        metadata: {
          levelNumber: currentLevelNumber,
          score: currentMastery.overallScore,
          decision: decision.decision,
          reason: decision.reason,
        },
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  async calculateLevelCompletion(
    userId: string,
    levelNumber: HSKLevelNumber,
    repo: LessonProgressRepository,
    snapshot?: RecommendationDataSnapshot
  ): Promise<HSKLevelCompletion> {
    const allLessons = snapshot?.allLessons ?? await curriculumRepository.getAllLessons();
    const levelLessons = allLessons.filter((l) => l.levelNumber === levelNumber);
    const requiredLessons = levelLessons.filter((l) => l.isRequired);

    const userProgressList = snapshot?.userProgressList ?? await repo.getProgress(userId);
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

    const vocabProgress = snapshot?.vocabularyProgress ?? await repo.getVocabularyProgress(userId);
    const grammarProgress = snapshot?.grammarProgress ?? await repo.getGrammarProgress(userId);
    const skillProgress = snapshot?.skillProgress ?? await repo.getSkillProgress(userId);
    const lessonLevels = new Map(allLessons.map((lesson) => [lesson.id, lesson.levelNumber]));
    const vocabularyLevels = snapshot?.vocabularyLevels ?? new Map((await curriculumRepository.getAllVocabulary()).map((item) => [item.id, item.hskLevel]));
    const grammarLevels = snapshot?.grammarLevels ?? new Map(ALL_GRAMMAR_POINTS.map((item) => [item.id, item.level]));
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

export const recommendationService = new RecommendationService();
