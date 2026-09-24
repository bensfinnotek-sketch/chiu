import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HSKLevelNumber,
  HSKLevelInfo,
  CurriculumUnit,
  Lesson,
  LessonSection,
  Vocabulary,
  GrammarPoint,
  QuizQuestion,
  UserLessonProgress,
  LearningRecommendation,
  HSKLevelCompletion,
} from '../types/curriculum';
import { curriculumRepository } from '../curriculum/curriculumRepository';
import { getLessonProgressRepository } from '../curriculum/lessonProgressRepository';
import { recommendationService } from '../curriculum/recommendationService';
import { useAuth } from './useAuth';
import { getProgressRepository } from '../services/repositories/repositoryFactory';
import { flashcardService } from '../services/flashcardService';

export function useCurriculum(levelNumber: HSKLevelNumber = 1) {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';
  const repo = useMemo(() => getLessonProgressRepository(user ? user.id : null), [user]);
  const progressRepo = useMemo(() => getProgressRepository(user), [user]);

  const [levels, setLevels] = useState<HSKLevelInfo[]>([]);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserLessonProgress>>({});
  const [levelCompletion, setLevelCompletion] = useState<HSKLevelCompletion | null>(null);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allLevels, unitList, allLessons, userProgress] = await Promise.all([
        curriculumRepository.getLevels(),
        curriculumRepository.getUnits(levelNumber),
        curriculumRepository.getAllLessons(),
        repo.getProgress(userId),
      ]);

      setLevels(allLevels);
      setUnits(unitList);
      setLessons(allLessons.filter((l) => l.levelNumber === levelNumber));

      const pMap: Record<string, UserLessonProgress> = {};
      userProgress.forEach((p) => {
        pMap[p.lessonId] = p;
      });
      setProgressMap(pMap);

      const [recs, comp] = await Promise.all([
        recommendationService.getRecommendations(userId, levelNumber, repo),
        recommendationService.calculateLevelCompletion(userId, levelNumber, repo),
      ]);

      setRecommendations(recs);
      setLevelCompletion(comp);
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    } finally {
      setIsLoading(false);
    }
  }, [levelNumber, userId, repo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    levels,
    units,
    lessons,
    progressMap,
    levelCompletion,
    recommendations,
    isLoading,
    refreshCurriculum: loadData,
  };
}

export function useLesson(lessonId: string) {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';
  const repo = useMemo(() => getLessonProgressRepository(user ? user.id : null), [user]);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [grammar, setGrammar] = useState<GrammarPoint[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userProgress, setUserProgress] = useState<UserLessonProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLesson = useCallback(async () => {
    setIsLoading(true);
    try {
      const [l, s, v, g, q, p] = await Promise.all([
        curriculumRepository.getLesson(lessonId),
        curriculumRepository.getLessonSections(lessonId),
        curriculumRepository.getVocabularyForLesson(lessonId),
        curriculumRepository.getGrammarForLesson(lessonId),
        curriculumRepository.getQuiz(lessonId),
        repo.getLessonProgress(userId, lessonId),
      ]);

      setLesson(l);
      setSections(s);
      setVocabulary(v);
      setGrammar(g);
      setQuizQuestions(q);
      setUserProgress(p);

      // Auto mark started if not started yet
      if (l && (!p || p.status === 'locked' || p.status === 'available')) {
        const started = await repo.markLessonStarted(userId, lessonId, l.levelNumber);
        setUserProgress(started);
      }
    } catch (err) {
      console.error('Failed to load lesson details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, userId, repo]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const saveSectionProgress = async (sectionId: string, percent: number) => {
    if (!lesson) return;
    const existing = await repo.getLessonProgress(userId, lessonId);
    const updated: UserLessonProgress = {
      userId,
      lessonId,
      levelNumber: lesson.levelNumber,
      status: existing?.status === 'completed' ? 'completed' : 'in_progress',
      progressPercent: Math.max(existing?.progressPercent || 0, percent),
      currentSectionId: sectionId,
      score: existing?.score,
      attempts: existing?.attempts || 1,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedAt: existing?.completedAt,
      lastAccessedAt: new Date().toISOString(),
    };
    await repo.saveProgress(updated);
    setUserProgress(updated);
  };

  const completeLesson = async (score: number) => {
    if (!lesson) return null;

    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
    const { progress, isFirstCompletion } = await repo.markLessonCompleted(
      userId,
      lessonId,
      normalizedScore,
      lesson.levelNumber
    );
    setUserProgress(progress);

    if (isFirstCompletion) {
      await progressRepo.recordStudyActivity(userId, {
        type: 'lesson',
        durationMinutes: lesson.estimatedMinutes,
        wordsLearnedDelta: vocabulary.length,
      });
    }

    // Lesson vocabulary becomes personal flashcards through the normal
    // authenticated path, so this does not consume the AI auto-save quota.
    let flashcardsSaved = 0;
    if (user && vocabulary.length > 0) {
      const saved = await flashcardService.upsertBatchFlashcards(
        vocabulary.slice(0, 20).map((item) => ({
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          meaning: item.meaning,
          example_sentence: item.exampleSentence,
          topic: `hsk-${lesson.levelNumber}-lesson`,
          hsk_level: lesson.levelNumber,
        }))
      );
      flashcardsSaved = saved.length;
    }

    // Completing a lesson records vocabulary exposure. Individual quiz
    // correctness can still refine these records when quiz answers are saved.
    await Promise.all(
      vocabulary.map((item) =>
        repo.updateVocabularyStatus(userId, item.id, 'learning')
      )
    );

    // Skill progress now follows the actual quiz result instead of a fixed
    // amount for every lesson.
    const skillDelta = Math.max(5, Math.round(normalizedScore * 0.15));
    await Promise.all([
      repo.updateSkillScore(userId, 'vocabulary', lesson.levelNumber, skillDelta),
      repo.updateSkillScore(userId, 'grammar', lesson.levelNumber, skillDelta),
    ]);

    // Recompute the next action immediately: review, next lesson, or next HSK.
    const [nextRecommendations, nextLevelCompletion] = await Promise.all([
      recommendationService.getRecommendations(userId, lesson.levelNumber, repo),
      recommendationService.calculateLevelCompletion(userId, lesson.levelNumber, repo),
    ]);

    return {
      progress,
      isFirstCompletion,
      flashcardsSaved,
      skillDelta,
      recommendations: nextRecommendations,
      levelCompletion: nextLevelCompletion,
    };
  };

  return {
    lesson,
    sections,
    vocabulary,
    grammar,
    quizQuestions,
    userProgress,
    isLoading,
    saveSectionProgress,
    completeLesson,
    reload: loadLesson,
  };
}
