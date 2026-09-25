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
  QuizAttempt,
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

