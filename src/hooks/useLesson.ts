import { useCallback, useEffect, useState } from 'react';
import { curriculumRepository } from '../curriculum/curriculumRepository';
import { LocalStorageLessonProgressRepository, LessonProgressRepository } from '../curriculum/lessonProgressRepository';
import { RecommendationService } from '../curriculum/recommendationService';
import { flashcardService } from '../services/flashcardService';
import { progressRepo } from '../services/progressRepo';
import { supabase } from '../database/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Lesson, QuizAttempt, UserLessonProgress } from '../types/curriculum';

const recommendationService = new RecommendationService();

export const useLesson = (lessonId: string | null) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sections, setSections] = useState<Lesson['sections']>([]);
  const [vocabulary, setVocabulary] = useState<Awaited<ReturnType<typeof curriculumRepository.getVocabularyForLesson>>>([]);
  const [grammar, setGrammar] = useState<Awaited<ReturnType<typeof curriculumRepository.getGrammarForLesson>>>([]);
  const [quizQuestions, setQuizQuestions] = useState<Awaited<ReturnType<typeof curriculumRepository.getQuizQuestionsForLesson>>>([]);
  const [userProgress, setUserProgress] = useState<UserLessonProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const repo: LessonProgressRepository = supabase
    ? progressRepo
    : new LocalStorageLessonProgressRepository();

  const loadLesson = useCallback(async () => {
    if (!lessonId) {
      setLesson(null);
      return;
    }
    setIsLoading(true);
    try {
      const [nextLesson, nextSections, nextVocabulary, nextGrammar, nextQuiz, nextProgress] = await Promise.all([
        curriculumRepository.getLessonById(lessonId),
        curriculumRepository.getSectionsForLesson(lessonId),
        curriculumRepository.getVocabularyForLesson(lessonId),
        curriculumRepository.getGrammarForLesson(lessonId),
        curriculumRepository.getQuizQuestionsForLesson(lessonId),
        repo.getLessonProgress(userId, lessonId),
      ]);
      setLesson(nextLesson);
      setSections(nextSections);
      setVocabulary(nextVocabulary);
      setGrammar(nextGrammar);
      setQuizQuestions(nextQuiz);
      setUserProgress(nextProgress);
      if (nextLesson && !nextProgress) {
        const started = await repo.markLessonStarted(userId, lessonId, nextLesson.levelNumber);
        setUserProgress(started);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, userId]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const saveSectionProgress = async (sectionId: string, percent: number) => {
    if (!lesson) return;
    const existing = await repo.getLessonProgress(userId, lessonId!);
    const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)));
    const updated: UserLessonProgress = {
      userId,
      lessonId: lessonId!,
      levelNumber: lesson.levelNumber,
      status: existing?.status === 'completed' ? 'completed' : 'in_progress',
      progressPercent: Math.max(existing?.progressPercent ?? 0, normalizedPercent),
      currentSectionId: sectionId,
      score: existing?.score,
      attempts: existing?.attempts ?? 0,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedAt: existing?.completedAt,
      lastAccessedAt: new Date().toISOString(),
    };
    await repo.saveProgress(updated);
    setUserProgress(updated);
  };

  const completeLesson = async (score: number, skillDeltas?: { vocabulary: number; grammar: number }) => {
    if (!lesson || !lessonId) return null;
    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
    const { progress, isFirstCompletion } = await repo.markLessonCompleted(userId, lessonId, normalizedScore, lesson.levelNumber);
    setUserProgress(progress);
    if (isFirstCompletion) {
      await progressRepo.recordStudyActivity(userId, {
        type: 'lesson', durationMinutes: lesson.estimatedMinutes, wordsLearnedDelta: vocabulary.length,
      });
    }
    let flashcardsSaved = 0;
    if (user && vocabulary.length > 0) {
      try {
        const saved = await flashcardService.upsertBatchFlashcards(vocabulary.slice(0, 20).map((item) => ({
          hanzi: item.hanzi, pinyin: item.pinyin, meaning: item.meaningVi,
          example_sentence: item.exampleSentence || undefined,
          topic: `hsk-${lesson.levelNumber}-lesson`, hsk_level: lesson.levelNumber,
        })));
        flashcardsSaved = saved.length;
      } catch (error) {
        console.warn('Failed to save lesson vocabulary to flashcards:', error);
      }
    }
    const fallbackDelta = Math.max(5, Math.round(normalizedScore * 0.15));
    const vocabularyDelta = skillDeltas?.vocabulary ?? fallbackDelta;
    const grammarDelta = skillDeltas?.grammar ?? fallbackDelta;
    await Promise.all([
      vocabularyDelta > 0 ? repo.updateSkillScore(userId, 'vocabulary', lesson.levelNumber, vocabularyDelta) : Promise.resolve(),
      grammarDelta > 0 ? repo.updateSkillScore(userId, 'grammar', lesson.levelNumber, grammarDelta) : Promise.resolve(),
    ]);
    const [nextRecommendations, nextLevelCompletion] = await Promise.all([
      recommendationService.getRecommendations(userId, lesson.levelNumber, repo),
      recommendationService.calculateLevelCompletion(userId, lesson.levelNumber, repo),
    ]);
    return { progress, isFirstCompletion, flashcardsSaved, skillDelta: vocabularyDelta + grammarDelta, recommendations: nextRecommendations, levelCompletion: nextLevelCompletion };
  };

  const completeQuiz = async (attempt: QuizAttempt) => {
    if (!lesson || !lessonId || attempt.lessonId !== lessonId) return null;
    const isNewAttempt = await repo.saveQuizAttempt(attempt);
    if (!isNewAttempt) {
      return {
        progress: userProgress,
        isFirstCompletion: false,
        flashcardsSaved: 0,
        skillDelta: 0,
        recommendations: await recommendationService.getRecommendations(userId, lesson.levelNumber, repo),
        levelCompletion: await recommendationService.calculateLevelCompletion(userId, lesson.levelNumber, repo),
      };
    }
    const questionMap = new Map(quizQuestions.map((question) => [question.id, question]));
    let vocabularyQuestions = 0;
    let vocabularyCorrect = 0;
    let grammarQuestions = 0;
    let grammarCorrect = 0;
    await Promise.all(attempt.answers.flatMap((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) return [];
      if ((question.vocabularyIds || []).length > 0) {
        vocabularyQuestions += 1;
        if (answer.isCorrect) vocabularyCorrect += 1;
      }
      if ((question.grammarPointIds || []).length > 0) {
        grammarQuestions += 1;
        if (answer.isCorrect) grammarCorrect += 1;
      }
      const vocabularyUpdates = (question.vocabularyIds || []).map((vocabularyId) => repo.updateVocabularyStatus(userId, vocabularyId, answer.isCorrect ? 'known' : 'learning', answer.isCorrect));
      const grammarUpdates = (question.grammarPointIds || []).map((grammarPointId) => repo.updateGrammarScore(userId, grammarPointId, answer.isCorrect));
      return [...vocabularyUpdates, ...grammarUpdates];
    }));
    const quizPassed = attempt.score >= lesson.passingScore;
    const requiredSectionsComplete = lesson.completionRule === 'all_required_and_quiz'
      ? (await repo.getLessonProgress(userId, lessonId))?.progressPercent >= 100
      : true;
    const canCompleteLesson = lesson.completionRule === 'quiz_pass'
      ? quizPassed
      : lesson.completionRule === 'all_required_and_quiz'
        ? quizPassed && requiredSectionsComplete
        : false;
    if (!canCompleteLesson) {
      const currentProgress = await repo.getLessonProgress(userId, lessonId);
      if (currentProgress) {
        const failedAttemptProgress: UserLessonProgress = {
          ...currentProgress,
          attempts: (currentProgress.attempts ?? 0) + 1,
          lastAccessedAt: new Date().toISOString(),
        };
        await repo.saveProgress(failedAttemptProgress);
        setUserProgress(failedAttemptProgress);
      }
      const recommendations = await recommendationService.getRecommendations(userId, lesson.levelNumber, repo);
      return {
        progress: currentProgress
          ? { ...currentProgress, attempts: (currentProgress.attempts ?? 0) + 1 }
          : userProgress,
        isFirstCompletion: false,
        flashcardsSaved: 0,
        skillDelta: 0,
        recommendations,
        levelCompletion: await recommendationService.calculateLevelCompletion(userId, lesson.levelNumber, repo),
      };
    }
    const vocabularyDelta = vocabularyQuestions > 0 ? Math.round((vocabularyCorrect / vocabularyQuestions) * 15) : 0;
    const grammarDelta = grammarQuestions > 0 ? Math.round((grammarCorrect / grammarQuestions) * 15) : 0;
    return completeLesson(attempt.score, { vocabulary: vocabularyDelta, grammar: grammarDelta });
  };
  return { lesson, sections, vocabulary, grammar, quizQuestions, userProgress, isLoading, saveSectionProgress, completeLesson, completeQuiz, reload: loadLesson };
};
