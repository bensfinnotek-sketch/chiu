export function useLesson(lessonId: string) {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';
  const repo = useMemo(() => getLessonProgressRepository(user ? user.id : null), [user]);
  const progressRepo = useMemo(() => getProgressRepository(user), [user]);

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
      attempts: existing?.attempts ?? 0,
      startedAt: existing?.startedAt || new Date().toISOString(),
      completedAt: existing?.completedAt,
      lastAccessedAt: new Date().toISOString(),
    };
    await repo.saveProgress(updated);
    setUserProgress(updated);
  };

  const completeLesson = async (
    score: number,
    skillDeltas?: { vocabulary: number; grammar: number }
  ) => {
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
      try {
        const saved = await flashcardService.upsertBatchFlashcards(
          vocabulary.slice(0, 20).map((item) => ({
            hanzi: item.hanzi,
            pinyin: item.pinyin,
            meaning: item.meaningVi,
            example_sentence: item.exampleSentence || undefined,
            topic: `hsk-${lesson.levelNumber}-lesson`,
            hsk_level: lesson.levelNumber,
          }))
        );
        flashcardsSaved = saved.length;
      } catch (error) {
        // Flashcards are a learning-loop side effect; a transient save error
        // must not erase the already-persisted lesson/quiz completion.
        console.warn('Failed to save lesson vocabulary to flashcards:', error);
      }
    }

    // Vocabulary mastery is already updated answer-by-answer by completeQuiz().
    // Do not overwrite known words here; doing so would downgrade successful quiz
    // answers back to "learning".
    // Skill progress now follows the actual quiz result instead of a fixed
    // amount for every lesson.
    // Attribute skill growth to the evidence actually collected by the quiz.
    // If the caller does not provide per-skill evidence, keep the previous
    // balanced fallback so lesson completion remains backwards compatible.
    const fallbackDelta = Math.max(5, Math.round(normalizedScore * 0.15));
    const vocabularyDelta = skillDeltas?.vocabulary ?? fallbackDelta;
    const grammarDelta = skillDeltas?.grammar ?? fallbackDelta;
    const skillDelta = vocabularyDelta + grammarDelta;

    await Promise.all([
      vocabularyDelta > 0
        ? repo.updateSkillScore(userId, 'vocabulary', lesson.levelNumber, vocabularyDelta)
        : Promise.resolve(),
      grammarDelta > 0
        ? repo.updateSkillScore(userId, 'grammar', lesson.levelNumber, grammarDelta)
        : Promise.resolve(),
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

  const completeQuiz = async (attempt: QuizAttempt) => {
    if (!lesson || attempt.lessonId !== lessonId) return null;

    // Persist the quiz as the source event for the learning loop.
    // Duplicate attempt IDs are treated as already processed, preventing mastery
    // and skill evidence from being applied twice after retries/double submits.
    const isNewAttempt = await repo.saveQuizAttempt(attempt);
    if (!isNewAttempt) {
      const currentProgress = await repo.getLessonProgress(userId, lessonId);
      return {
        progress: currentProgress,
        isFirstCompletion: false,
        flashcardsSaved: 0,
        skillDelta: 0,
        recommendations: await recommendationService.getRecommendations(userId, lesson.levelNumber, repo),
        levelCompletion: await recommendationService.calculateLevelCompletion(userId, lesson.levelNumber, repo),
      };
    }

    // Feed answer-level evidence back into vocabulary and grammar mastery.
    // The same answer can contribute to both skill dimensions when a quiz
    // question tests vocabulary inside a grammar structure.
    const questionMap = new Map(quizQuestions.map((question) => [question.id, question]));
    let vocabularyQuestions = 0;
    let vocabularyCorrect = 0;
    let grammarQuestions = 0;
    let grammarCorrect = 0;
    await Promise.all(
      attempt.answers.flatMap((answer) => {
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

        const vocabularyUpdates = (question.vocabularyIds || []).map((vocabularyId) =>
          repo.updateVocabularyStatus(
            userId,
            vocabularyId,
            answer.isCorrect ? 'known' : 'learning',
            answer.isCorrect
          )
        );
        const grammarUpdates = (question.grammarPointIds || []).map((grammarPointId) =>
          repo.updateGrammarScore(userId, grammarPointId, answer.isCorrect)
        );

        return [...vocabularyUpdates, ...grammarUpdates];
      })
    );

    if (!attempt.passed) {
      const currentProgress = await repo.getLessonProgress(userId, lessonId);
      const failedAttemptProgress = currentProgress
        ? {
            ...currentProgress,
            attempts: (currentProgress.attempts ?? 0) + 1,
            lastAccessedAt: new Date().toISOString(),
          }
        : null;

      if (failedAttemptProgress) {
        await repo.saveProgress(failedAttemptProgress);
        setUserProgress(failedAttemptProgress);
      }

      const recommendations = await recommendationService.getRecommendations(
        userId,
        lesson.levelNumber,
        repo
      );
      return {
        progress: failedAttemptProgress ?? currentProgress ?? userProgress,
        isFirstCompletion: false,
        flashcardsSaved: 0,
        skillDelta: 0,
        recommendations,
        levelCompletion: await recommendationService.calculateLevelCompletion(
          userId,
          lesson.levelNumber,
          repo
        ),
      };
    }

    const vocabularyDelta = vocabularyQuestions > 0
      ? Math.round((vocabularyCorrect / vocabularyQuestions) * 15)
      : 0;
    const grammarDelta = grammarQuestions > 0
      ? Math.round((grammarCorrect / grammarQuestions) * 15)
      : 0;

    return completeLesson(attempt.score, {
      vocabulary: vocabularyDelta,
      grammar: grammarDelta,
    });
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
    completeQuiz,
    reload: loadLesson,
  };
}
