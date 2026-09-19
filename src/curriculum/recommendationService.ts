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

    // Rule 3: If all completed, return first lesson or next level
    return levelLessons[0] || null;
  }

  async getRecommendations(
    userId: string,
    currentLevelNumber: HSKLevelNumber,
    repo: LessonProgressRepository
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    const nextLesson = await this.getNextLessonToStudy(userId, currentLevelNumber, repo);

    if (nextLesson) {
      const userProgress = await repo.getLessonProgress(userId, nextLesson.id);
      const isResume = userProgress?.status === 'in_progress';

      recommendations.push({
        type: isResume ? 'continue_lesson' : 'next_lesson',
        title: isResume ? `Tiếp tục bài học: ${nextLesson.title}` : `Bài học tiếp theo: ${nextLesson.title}`,
        description: `${nextLesson.titleZh} · Dự kiến ${nextLesson.estimatedMinutes} phút`,
        targetId: nextLesson.id,
        priority: 1,
        actionText: isResume ? 'Học tiếp ngay' : 'Bắt đầu học',
        metadata: { levelNumber: nextLesson.levelNumber },
      });
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
