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
import { analyzeQuizDiagnosticEvidence, calculateLearningMomentum, decideLearningNextStep, getDiagnosticFocus } from './learningDecisionEngine';
import { DEEP_EXPANDED_GRAMMAR } from './deepGrammarData';

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
    const allGrammar = [...ALL_GRAMMAR_POINTS, ...DEEP_EXPANDED_GRAMMAR];
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
    const quizQuestionsByLesson = new Map<string, import('../types/curriculum').QuizQuestion[]>();
    await Promise.all(
      allLessons
        .filter((lesson) => lesson.levelNumber === currentLevelNumber)
        .map(async (lesson) => {
          quizQuestionsByLesson.set(lesson.id, await curriculumRepository.getQuiz(lesson.id));
        })
    );
    const diagnosticEvidence = analyzeQuizDiagnosticEvidence(quizAttempts, quizQuestionsByLesson);
    const diagnosticFocus = diagnosticEvidence.focus === 'balanced'
      ? getDiagnosticFocus({
          vocabularyScore: currentMastery.vocabularyScore,
          grammarScore: currentMastery.grammarScore,
          quizScore: currentMastery.quizScore,
          weakVocabularyCount: currentMastery.weakVocabularyCount,
          weakGrammarCount: currentMastery.weakGrammarCount,
        })
      : diagnosticEvidence.focus;
    const diagnosticTargets = [
      ...diagnosticEvidence.vocabularyWeaknesses.map((item) => ({ kind: 'vocabulary' as const, ...item })),
      ...diagnosticEvidence.grammarWeaknesses.map((item) => ({ kind: 'grammar' as const, ...item })),
    ]
      .map((item) => {
        const patternWeight = {
          persistent: 100,
          recent: 90,
          new: 65,
          improving: 40,
        }[item.errorPattern];
        const confidenceWeight = item.confidence >= 80 ? 15 : item.confidence >= 60 ? 5 : -10;
        const agingPenalty = (item.ageDays ?? 0) >= 14 ? 20 : (item.ageDays ?? 0) >= 7 ? 8 : 0;
        return {
          kind: item.kind,
          id: item.id,
          accuracy: item.accuracy,
          errorPattern: item.errorPattern,
          confidence: item.confidence,
          evidenceCount: item.evidenceCount,
          ageDays: item.ageDays,
          diagnosticPriority: patternWeight + confidenceWeight - agingPenalty,
        };
      })
      .sort((a, b) =>
        b.diagnosticPriority - a.diagnosticPriority
        || a.accuracy - b.accuracy
        || b.confidence - a.confidence
      )
      .slice(0, 5);
    const vocabularyById = new Map(allVocabulary.map((item) => [item.id, item]));
    const grammarById = new Map(allGrammar.map((item) => [item.id, item]));
    const diagnosticTargetLabels = diagnosticTargets.map((item) => {
      const aging = (item.ageDays ?? 0) >= 14 ? ' · cần xác nhận lại' : '';
      const confidence = item.confidence < 60 ? ' · tín hiệu chưa chắc' : '';
      if (item.kind === 'vocabulary') {
        const vocab = vocabularyById.get(item.id);
        return vocab ? `${vocab.hanzi} · ${vocab.meaningVi} (${item.accuracy}%)${aging}${confidence}` : item.id;
      }
      const grammar = grammarById.get(item.id);
      return grammar ? `${grammar.title} (${item.accuracy}%)${aging}${confidence}` : item.id;
    });
    const diagnosticTargetIds = new Set(diagnosticTargets.map((item) => item.id));
    const diagnosticConfidence = diagnosticEvidence.confidence;
    const diagnosticEvidenceCount = diagnosticEvidence.evidenceCount;
    const diagnosticAgingNote = diagnosticTargets.length > 0
      ? diagnosticTargets.some((item) => {
          const source = item.kind === 'vocabulary'
            ? diagnosticEvidence.vocabularyWeaknesses.find((w) => w.id === item.id)
            : diagnosticEvidence.grammarWeaknesses.find((w) => w.id === item.id);
          return (source?.ageDays ?? 0) >= 14;
        })
        ? ' Một số điểm yếu đã cũ; cần xác nhận lại bằng bài kiểm tra mới.'
        : ''
      : '';


    const coachGoal = diagnosticFocus === 'vocabulary'
      ? 'Sau phiên này, mục tiêu là nâng độ chính xác của các từ đang yếu và dùng chúng đúng trong ngữ cảnh.'
      : diagnosticFocus === 'grammar'
        ? 'Sau phiên này, mục tiêu là giảm lỗi ở cấu trúc ngữ pháp đang yếu và dùng đúng trong câu mới.'
        : diagnosticFocus === 'quiz'
          ? 'Sau phiên này, mục tiêu là cải thiện các câu hỏi chẩn đoán sai và ổn định điểm quiz từ 80% trở lên.'
          : 'Sau phiên này, mục tiêu là giữ cân bằng từ vựng, ngữ pháp và quiz để duy trì đà học.';
    const recentCompleted = userProgressList
      .filter((progress) => progress.status === 'completed' && progress.completedAt)
      .sort((a, b) => Date.parse(b.completedAt || '') - Date.parse(a.completedAt || ''))[0];
    const recentScore = recentCompleted?.score ?? null;
    const coachOutcome = diagnosticFocus === 'vocabulary'
      ? 'Đạt ≥80% độ chính xác ở nhóm từ mục tiêu và dùng lại chúng trong ngữ cảnh của bài.'
      : diagnosticFocus === 'grammar'
        ? 'Đạt ≥80% ở các câu áp dụng cấu trúc mục tiêu và giảm lỗi lặp lại.'
        : diagnosticFocus === 'quiz'
          ? 'Đưa quiz mục tiêu lên ≥80% trước khi tăng tải bài mới.'
          : 'Hoàn thành phiên học và giữ mastery ổn định trước khi tăng tải.';
    const coachCheckpoint = recentScore !== null
      ? recentScore < 80
        ? `Bài hoàn thành gần nhất đạt ${recentScore}%. Phiên kế tiếp sẽ ưu tiên củng cố trước khi tăng tải.`
        : recentScore >= 90
          ? `Bài hoàn thành gần nhất đạt ${recentScore}%. Có thể tăng nhẹ phần học mới nếu nhịp học vẫn ổn định.`
          : `Bài hoàn thành gần nhất đạt ${recentScore}%. Giữ nhịp hiện tại và kiểm tra lại điểm yếu.`
      : 'Chưa có bài hoàn thành gần đây; AI sẽ dùng dữ liệu quiz và mastery hiện tại làm mốc ban đầu.';
    const coachReason = diagnosticTargets.length > 0
      ? `AI-9 chọn mục tiêu này vì dữ liệu quiz gần đây cho thấy ${diagnosticTargets.slice(0, 2).map((item) => item.kind === 'vocabulary' ? 'từ vựng' : 'ngữ pháp').join(' và ')} đang có tín hiệu yếu nhất.`
      : `AI-9 chọn mục tiêu dựa trên mastery hiện tại: từ vựng ${currentMastery.vocabularyScore}, ngữ pháp ${currentMastery.grammarScore}, quiz ${currentMastery.quizScore}.`;
    // Close the Diagnostic -> Recommendation -> Lesson loop by selecting the
    // most actionable lesson that actually contains the diagnosed weaknesses.
    // Matching is weighted by diagnostic priority and target coverage, while
    // completed high-scoring lessons are de-emphasized so the signal leads to
    // a lesson the learner can meaningfully act on.
    const progressMap = new Map(userProgressList.map((progress) => [progress.lessonId, progress]));
    const diagnosticPriorityById = new Map(diagnosticTargets.map((target) => [target.id, target.diagnosticPriority]));
    const diagnosticLessonCandidate = allLessons
      .filter((lesson) => lesson.levelNumber === currentLevelNumber)
      .map((lesson) => {
        const questions = quizQuestionsByLesson.get(lesson.id) || [];
        const matchedTargetIds = new Set(
          questions.flatMap((question) => [...(question.vocabularyIds || []), ...(question.grammarPointIds || [])])
            .filter((id) => diagnosticTargetIds.has(id))
        );
        const diagnosticScore = [...matchedTargetIds].reduce(
          (total, id) => total + (diagnosticPriorityById.get(id) || 0),
          0
        );
        const progress = progressMap.get(lesson.id);
        const completedHighScorePenalty = progress?.status === 'completed' && (progress.score ?? 0) >= 80 ? 50 : 0;
        const inProgressBonus = progress?.status === 'in_progress' ? 20 : 0;
        return {
          lesson,
          matchedTargetCount: matchedTargetIds.size,
          diagnosticScore: diagnosticScore + matchedTargetIds.size * 25 + inProgressBonus - completedHighScorePenalty,
        };
      })
      .filter((candidate) => candidate.matchedTargetCount > 0)
      .sort((a, b) =>
        b.diagnosticScore - a.diagnosticScore
        || b.matchedTargetCount - a.matchedTargetCount
        || a.lesson.order - b.lesson.order
      )[0];
    const diagnosticLessonId = diagnosticLessonCandidate?.lesson.id;
    const diagnosticLesson = diagnosticLessonCandidate?.lesson ?? null;
    const actionableDiagnosticLesson = diagnosticLesson
      && (progressMap.get(diagnosticLesson.id)?.status !== 'completed' || (progressMap.get(diagnosticLesson.id)?.score ?? 0) < 80)
      ? diagnosticLesson
      : null;
    const momentum = calculateLearningMomentum(userProgressList);
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
      momentumScore: momentum.score,
      momentumTrend: momentum.trend,
    });

    // Route lesson and quiz recommendations only after the unified decision is known.
    // This prevents lower-priority suggestions from conflicting with SRS/HSK decisions.
    if (decision.decision === 'learn_lesson' && (actionableDiagnosticLesson || nextLesson) && levelCompletion.completionPercent < 100) {
      const lessonToRecommend = actionableDiagnosticLesson || nextLesson;
      const userProgress = await repo.getLessonProgress(userId, lessonToRecommend.id);
      const isResume = userProgress?.status === 'in_progress';
      const isCompletedReview = userProgress?.status === 'completed';
      recommendations.push({
        type: isCompletedReview ? 'retry_quiz' : isResume ? 'continue_lesson' : 'next_lesson',
        title: isCompletedReview
          ? `Củng cố bài cần ôn: ${lessonToRecommend.title}`
          : isResume
            ? `Tiếp tục bài học: ${nextLesson.title}`
            : actionableDiagnosticLesson
              ? `Củng cố mục tiêu chẩn đoán: ${lessonToRecommend.title}`
              : `Bài học tiếp theo: ${lessonToRecommend.title}`,
        description: isCompletedReview
          ? `Điểm tốt nhất ${userProgress?.score ?? 0}% · ${lessonToRecommend.titleZh}`
          : `${lessonToRecommend.titleZh} · Dự kiến ${lessonToRecommend.estimatedMinutes} phút`,
        targetId: lessonToRecommend.id,
        priority: actionableDiagnosticLesson ? Math.max(0, decision.priority - 1) : decision.priority,
        actionText: isCompletedReview ? 'Ôn lại bài' : isResume ? 'Học tiếp ngay' : 'Bắt đầu học',
        metadata: {
          levelNumber: lessonToRecommend.levelNumber,
          score: userProgress?.score ?? undefined,
          decision: decision.decision,
          reason: decision.reason,
         diagnosticFocus,

         diagnosticTargets,

         diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,

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
         diagnosticFocus,

         diagnosticTargets,

         diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,

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
          diagnosticFocus,
          diagnosticTargets,
          diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,
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
          diagnosticFocus,
          diagnosticTargets,
          diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,
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
          diagnosticFocus,
          diagnosticTargets,
          diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,
        },
      });
    }

    if (decision.decision === 'review_quiz' && weakestComponent.key === 'quiz' && currentMastery.quizAttempts > 0 && currentMastery.quizScore < 80) {
      const levelLessons = allLessons
        .filter((lesson) => lesson.levelNumber === currentLevelNumber)
        .sort((a, b) => a.order - b.order);
      const weakQuiz = levelLessons
        .map((lesson: Lesson) => ({
          lesson,
          score: quizAttempts
            .filter((attempt) => attempt.lessonId === lesson.id)
            .reduce((best, attempt) => Math.max(best, attempt.score), 0),
        }))
        .filter((item: { lesson: Lesson; score: number }) => item.score > 0 && item.score < 80)
        .sort((a: { lesson: Lesson; score: number }, b: { lesson: Lesson; score: number }) => {
          if (a.lesson.id === diagnosticLessonId) return -1;
          if (b.lesson.id === diagnosticLessonId) return 1;
          return a.score - b.score;
        })[0];

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
            diagnosticFocus,
            diagnosticTargets,
            diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,
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
          diagnosticFocus,
          diagnosticTargets,
          diagnosticLessonId,
          diagnosticTargetLabels,
          coachReason,
          coachGoal,
          diagnosticConfidence,
          diagnosticEvidenceCount,
          diagnosticAgingNote,
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
    const grammarLevels = snapshot?.grammarLevels ?? new Map([...ALL_GRAMMAR_POINTS, ...DEEP_EXPANDED_GRAMMAR].map((item) => [item.id, item.level]));
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
