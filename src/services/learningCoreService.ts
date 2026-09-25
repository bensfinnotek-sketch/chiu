import {
  HSKLevelNumber,
  Lesson,
  LearningRecommendation,
  QuizAttempt,
  UserLessonProgress,
  UserVocabularyProgress,
  UserGrammarProgress,
} from '../types/curriculum';

export interface LearningCoreSnapshot {
  lessons: Lesson[];
  lessonProgress: UserLessonProgress[];
  quizAttempts: QuizAttempt[];
  vocabularyProgress: UserVocabularyProgress[];
  grammarProgress: UserGrammarProgress[];
}

/**
 * Builds a small, deterministic next-step plan from persisted learning data.
 * Keeping this logic outside React makes dashboard, lesson and review screens
 * consume the same progression rules.
 */
export function buildLearningRecommendations(
  snapshot: LearningCoreSnapshot,
  options: { levelNumber?: HSKLevelNumber; limit?: number } = {}
): LearningRecommendation[] {
  const limit = Math.max(1, Math.min(8, options.limit ?? 4));
  const lessons = snapshot.lessons.filter((lesson) => lesson.isPublished && lesson.status === 'published');
  const progressByLesson = new Map(snapshot.lessonProgress.map((item) => [item.lessonId, item]));

  const recommendations: LearningRecommendation[] = [];

  const inProgress = lessons
    .map((lesson) => ({ lesson, progress: progressByLesson.get(lesson.id) }))
    .filter(
      (item) =>
        item.progress?.status === 'in_progress' &&
        (!options.levelNumber || item.lesson.levelNumber === options.levelNumber)
    )
    .sort(
      (a, b) =>
        new Date(b.progress!.lastAccessedAt).getTime() -
        new Date(a.progress!.lastAccessedAt).getTime()
    )[0];

  if (inProgress) {
    recommendations.push({
      type: 'continue_lesson',
      title: 'Tiếp tục bài đang học',
      description: inProgress.lesson.title,
      targetId: inProgress.lesson.id,
      priority: 100,
      actionText: 'Tiếp tục học',
      metadata: {
        levelNumber: inProgress.lesson.levelNumber,
        reason: 'lesson_in_progress',
        decision: 'learn_lesson',
      },
    });
  }

  const weakVocabulary = snapshot.vocabularyProgress
    .filter((item) => item.status !== 'mastered' && item.masteryScore < 60)
    .sort((a, b) => a.masteryScore - b.masteryScore);

  if (weakVocabulary.length > 0) {
    recommendations.push({
      type: 'review_vocabulary',
      title: 'Ôn lại từ vựng cần củng cố',
      description: 'Có những từ bạn đã gặp nhưng độ thành thạo còn thấp.',
      targetId: weakVocabulary[0].vocabularyId,
      priority: 90,
      actionText: 'Ôn từ vựng',
      metadata: {
        wordCount: Math.min(10, weakVocabulary.length),
        reason: 'low_vocabulary_mastery',
        decision: 'review_srs',
      },
    });
  }

  const weakGrammar = snapshot.grammarProgress
    .filter((item) => item.masteryScore < 60)
    .sort((a, b) => a.masteryScore - b.masteryScore);

  if (weakGrammar.length > 0) {
    recommendations.push({
      type: 'review_grammar',
      title: 'Ôn lại ngữ pháp',
      description: 'Tập trung vào điểm ngữ pháp có độ thành thạo thấp.',
      targetId: weakGrammar[0].grammarPointId,
      priority: 80,
      actionText: 'Ôn ngữ pháp',
      metadata: {
        reason: 'low_grammar_mastery',
        decision: 'review_srs',
      },
    });
  }

  const latestFailedQuiz = [...snapshot.quizAttempts]
    .filter((attempt) => !attempt.passed)
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];

  if (latestFailedQuiz) {
    const lesson = lessons.find((item) => item.id === latestFailedQuiz.lessonId);
    recommendations.push({
      type: 'retry_quiz',
      title: 'Làm lại bài kiểm tra',
      description: lesson
        ? `Ôn lại ${lesson.title} rồi thử lại bài kiểm tra.`
        : 'Ôn lại bài học rồi thử lại bài kiểm tra.',
      targetId: latestFailedQuiz.lessonId,
      priority: 70,
      actionText: 'Làm lại quiz',
      metadata: {
        levelNumber: lesson?.levelNumber,
        score: latestFailedQuiz.score,
        reason: 'latest_failed_quiz',
        decision: 'review_quiz',
      },
    });
  }

  const completedIds = new Set(
    snapshot.lessonProgress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonId)
  );

  const nextLesson = lessons
    .filter(
      (lesson) =>
        !completedIds.has(lesson.id) &&
        (!options.levelNumber || lesson.levelNumber === options.levelNumber)
    )
    .sort(
      (a, b) =>
        a.levelNumber - b.levelNumber ||
        a.order - b.order
    )
    .find((lesson) => {
      if (!lesson.prerequisiteLessonId) return true;
      return completedIds.has(lesson.prerequisiteLessonId);
    });

  if (nextLesson) {
    recommendations.push({
      type: 'next_lesson',
      title: 'Bài học tiếp theo',
      description: nextLesson.title,
      targetId: nextLesson.id,
      priority: 60,
      actionText: 'Học bài tiếp theo',
      metadata: {
        levelNumber: nextLesson.levelNumber,
        reason: 'next_available_lesson',
        decision: 'learn_lesson',
      },
    });
  }

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) => candidate.type === item.type && candidate.targetId === item.targetId
        ) === index
    )
    .slice(0, limit);
}

export function calculateLevelCompletion(
  levelNumber: HSKLevelNumber,
  lessons: Lesson[],
  lessonProgress: UserLessonProgress[],
  quizAttempts: QuizAttempt[],
  vocabularyProgress: UserVocabularyProgress[],
  grammarProgress: UserGrammarProgress[]
) {
  const levelLessons = lessons.filter(
    (lesson) => lesson.levelNumber === levelNumber && lesson.isRequired && lesson.isPublished
  );
  const requiredCount = levelLessons.length;
  const progressMap = new Map(lessonProgress.map((item) => [item.lessonId, item]));

  const completedLessons = levelLessons.filter(
    (lesson) => progressMap.get(lesson.id)?.status === 'completed'
  ).length;

  const levelQuizAttempts = quizAttempts.filter((attempt) =>
    levelLessons.some((lesson) => lesson.id === attempt.lessonId)
  );
  const averageQuizScore = levelQuizAttempts.length
    ? levelQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
      levelQuizAttempts.length
    : 0;

  const vocabularyMastery = vocabularyProgress.length
    ? vocabularyProgress.reduce((sum, item) => sum + item.masteryScore, 0) /
      vocabularyProgress.length
    : 0;
  const grammarMastery = grammarProgress.length
    ? grammarProgress.reduce((sum, item) => sum + item.masteryScore, 0) /
      grammarProgress.length
    : 0;

  const completionPercent = requiredCount
    ? Math.round((completedLessons / requiredCount) * 100)
    : 0;
  const masteryScore = Math.round(
    completionPercent * 0.5 +
      averageQuizScore * 0.25 +
      vocabularyMastery * 0.125 +
      grammarMastery * 0.125
  );

  return {
    level: levelNumber,
    completionPercent,
    completedLessons,
    totalRequiredLessons: requiredCount,
    averageQuizScore: Math.round(averageQuizScore),
    masteryScore,
    vocabularyMastery: Math.round(vocabularyMastery),
    grammarMastery: Math.round(grammarMastery),
    quizMastery: Math.round(averageQuizScore),
    weakVocabularyCount: vocabularyProgress.filter((item) => item.masteryScore < 60).length,
    weakGrammarCount: grammarProgress.filter((item) => item.masteryScore < 60).length,
  };
}
