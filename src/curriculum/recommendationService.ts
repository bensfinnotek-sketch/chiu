import {
  HSKLevelNumber,
  Lesson,
  UserLessonProgress,
  LearningRecommendation,
  HSKLevelCompletion,
} from '../types/curriculum';
import { curriculumRepository } from './curriculumRepository';
import { LessonProgressRepository } from './lessonProgressRepository';

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

    // Once the current HSK level is fully completed, make the next level an
    // explicit recommendation instead of repeatedly recommending old lessons.
    // The UI decides whether the next level is available on the user's plan.
    if (levelCompletion.completionPercent >= 100 && currentLevelNumber < 6) {
      const nextLevel = (currentLevelNumber + 1) as HSKLevelNumber;
      recommendations.push({
        type: 'next_lesson',
        title: `Đã hoàn thành HSK ${currentLevelNumber} · sẵn sàng lên HSK ${nextLevel}`,
        description: 'Bạn đã hoàn thành toàn bộ bài bắt buộc của cấp độ hiện tại. Tiếp tục sang cấp độ kế tiếp để duy trì đà học.',
        targetId: `level:${nextLevel}`,
        priority: 0,
        actionText: `Học HSK ${nextLevel}`,
        metadata: { levelNumber: nextLevel },
      });
    }

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
        priority: 1,
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

    // Skill profile signal: use the weakest measured skill to shape the next action.
    const skillProgress = await repo.getSkillProgress(userId);
    const currentLevelSkills = skillProgress
      .filter((skill) => skill.level === currentLevelNumber)
      .sort((a, b) => a.score - b.score);
    const weakestSkill = currentLevelSkills[0];

    if (weakestSkill && weakestSkill.score < 60) {
      const skillLabels: Record<string, string> = {
        vocabulary: 'từ vựng',
        grammar: 'ngữ pháp',
        listening: 'nghe',
        speaking: 'nói',
        reading: 'đọc',
        writing: 'viết',
      };
      const label = skillLabels[weakestSkill.skill] || weakestSkill.skill;

      // Only emit an actionable recommendation for skills that currently have
      // a supported destination in the learning UI. Do not mislabel listening,
      // speaking, reading, or writing weakness as grammar weakness.
      if (weakestSkill.skill === 'vocabulary' || weakestSkill.skill === 'grammar') {
        recommendations.push({
          type: weakestSkill.skill === 'vocabulary' ? 'review_vocabulary' : 'review_grammar',
          title: `Củng cố kỹ năng ${label}`,
          description: `Hồ sơ kỹ năng HSK ${currentLevelNumber} hiện ở ${weakestSkill.score}/100. Ưu tiên luyện ${label} trước khi học thêm nội dung mới.`,
          targetId: weakestSkill.skill === 'vocabulary' ? 'flashcards' : 'grammar',
          priority: 2,
          actionText: weakestSkill.skill === 'vocabulary' ? 'Ôn flashcards' : 'Ôn ngữ pháp',
          metadata: { levelNumber: currentLevelNumber, score: weakestSkill.score },
        });
      }
    }

    // Check vocabulary review recommendation
    const vocabProgress = await repo.getVocabularyProgress(userId);
    const weakVocab = vocabProgress.filter((v) => v.status === 'learning' || v.incorrectCount > 1);

    if (weakVocab.length > 0) {
      recommendations.push({
        type: 'review_vocabulary',
        title: `Ôn tập ${Math.min(weakVocab.length, 10)} từ vựng cần củng cố`,
        description: 'Tăng phản xạ từ vựng trước khi chuyển sang bài mới.',
        targetId: 'flashcards',
        priority: 2,
        actionText: 'Ôn tập ngay',
        metadata: { wordCount: weakVocab.length },
      });
    }

    // Check grammar review recommendation
    const grammarProgress = await repo.getGrammarProgress(userId);
    const weakGrammar = grammarProgress.filter((g) => g.masteryScore < 60);

    if (weakGrammar.length > 0) {
      recommendations.push({
        type: 'review_grammar',
        title: 'Củng cố ngữ pháp còn yếu',
        description: 'Luyện tập các mẫu câu và bài tập cấu trúc trọng điểm.',
        targetId: weakGrammar[0].grammarPointId,
        priority: 3,
        actionText: 'Xem ngữ pháp',
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

    return {
      userId,
      level: levelNumber,
      completionPercent: percent,
      completedLessons: completedCount,
      totalRequiredLessons: totalRequired,
      averageQuizScore: avgScore,
      completedAt: percent >= 100 ? new Date().toISOString() : null,
    };
  }
}

export const recommendationService = new RecommendationService();
