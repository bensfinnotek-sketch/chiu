import { HSKLevelNumber } from '../types/curriculum';

export type RecommendationDecision = 'review_srs' | 'review_quiz' | 'learn_lesson' | 'advance_hsk';

export interface RecommendationDecisionInput {
  masteryScore: number;
  momentumScore?: number;
  momentumTrend?: 'rising' | 'stable' | 'falling';
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

  if (input.highPriorityDueCards > 0 || input.dueCardCount > 0) {
    return { decision: 'review_srs', priority: 1, reason: 'Có flashcards đến hạn hoặc đang có mức ưu tiên ôn cao.' };
  }

  if (masteryReady && input.currentLevel < 6) {
    return { decision: 'advance_hsk', priority: 0, reason: 'Không còn SRS cần ưu tiên và HSK hiện tại đã đủ completion + mastery để chuyển cấp.' };
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

  if ((input.momentumTrend === 'falling' || (input.momentumScore ?? 50) < 35) && input.completionPercent < 100) {
    return { decision: 'learn_lesson', priority: 3, reason: 'Tiến độ gần đây đang chậm lại; ưu tiên bài học vừa sức để giữ nhịp ổn định.' };
  }

  return { decision: 'learn_lesson', priority: 3, reason: 'Tiếp tục bài học mới để duy trì tiến độ.' };
}

export interface LearningMomentum {
  score: number;
  trend: 'rising' | 'stable' | 'falling';
  consistency: number;
}

export function calculateLearningMomentum(
  progressList: Array<{ status?: string; progressPercent?: number; lastAccessedAt?: string | null }>
): LearningMomentum {
  const recent = [...progressList]
    .filter((item) => item.lastAccessedAt)
    .sort((a, b) => Date.parse(String(b.lastAccessedAt)) - Date.parse(String(a.lastAccessedAt)))
    .slice(0, 8);

  if (!recent.length) return { score: 50, trend: 'stable', consistency: 50 };

  const completionRate = recent.filter((item) => item.status === 'completed').length / recent.length * 100;
  const progressRate = recent.reduce((sum, item) => sum + Math.max(0, Math.min(100, Number(item.progressPercent || 0))), 0) / recent.length;
  const consistency = Math.round((recent.filter((item) => Number(item.progressPercent || 0) > 0).length / recent.length) * 100);
  const score = Math.round(completionRate * 0.6 + progressRate * 0.4);

  if (recent.length < 4) return { score, trend: 'stable', consistency };
  const latest = recent.slice(0, Math.ceil(recent.length / 2));
  const previous = recent.slice(Math.ceil(recent.length / 2));
  const latestAvg = latest.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / latest.length;
  const previousAvg = previous.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) / previous.length;
  const delta = latestAvg - previousAvg;
  const trend = delta >= 12 ? 'rising' : delta <= -12 ? 'falling' : 'stable';
  return { score, trend, consistency };
}

export type DiagnosticFocus = 'vocabulary' | 'grammar' | 'quiz' | 'balanced';

export type DiagnosticErrorPattern = 'persistent' | 'recent' | 'improving' | 'new';

export interface DiagnosticWeakness {
  id: string;
  incorrect: number;
  total: number;
  accuracy: number;
  confidence: number;
  evidenceCount: number;
  lastSeenAt: string | null;
  ageDays: number | null;
  errorPattern: DiagnosticErrorPattern;
}

export interface DiagnosticEvidence {
  vocabularyWeaknesses: DiagnosticWeakness[];
  grammarWeaknesses: DiagnosticWeakness[];
  focus: DiagnosticFocus;
  confidence: number;
  evidenceCount: number;
}

export function analyzeQuizDiagnosticEvidence(
  attempts: import('../types/curriculum').QuizAttempt[],
  questionsByLesson: Map<string, import('../types/curriculum').QuizQuestion[]>
): DiagnosticEvidence {
  type Evidence = {
    incorrect: number;
    total: number;
    attempts: number;
    latestAt: number;
    errors: boolean[];
  };

  const maps = {
    vocabulary: new Map<string, Evidence>(),
    grammar: new Map<string, Evidence>(),
  };
  const recent = [...attempts]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, 12);

  recent.forEach((attempt, index) => {
    const weight = Math.max(0.45, 1 - index * 0.05);
    const questions = new Map(
      (questionsByLesson.get(attempt.lessonId) || []).map((q) => [q.id, q])
    );

    attempt.answers.forEach((answer) => {
      const q = questions.get(answer.questionId);
      if (!q) return;

      for (const [kind, ids] of [
        ['vocabulary', q.vocabularyIds || []],
        ['grammar', q.grammarPointIds || []],
      ] as const) {
        const map = maps[kind];
        ids.forEach((id) => {
          const v = map.get(id) || {
            incorrect: 0,
            total: 0,
            attempts: 0,
            latestAt: 0,
            errors: [] as boolean[],
          };
          v.total += weight;
          if (!answer.isCorrect) v.incorrect += weight;
          v.latestAt = Math.max(v.latestAt, Date.parse(attempt.completedAt));
          v.attempts += 1;
          v.errors.unshift(!answer.isCorrect);
          map.set(id, v);
        });
      }
    });
  });

  const now = Date.now();
  const build = (map: Map<string, Evidence>): DiagnosticWeakness[] =>
    [...map.entries()]
      .map(([id, v]) => {
        const accuracy = Math.round((1 - v.incorrect / Math.max(v.total, 1)) * 100);
        const recentErrors = v.errors.slice(0, 3);
        const olderErrors = v.errors.slice(3, 6);
        const recentRate = recentErrors.length
          ? recentErrors.filter(Boolean).length / recentErrors.length
          : 0;
        const olderRate = olderErrors.length
          ? olderErrors.filter(Boolean).length / olderErrors.length
          : recentRate;

        const errorPattern: DiagnosticErrorPattern =
          v.attempts <= 1
            ? 'new'
            : recentRate >= 0.5 && olderRate >= 0.5
              ? 'persistent'
              : recentRate < olderRate - 0.2
                ? 'improving'
                : recentRate >= 0.5
                  ? 'recent'
                  : 'improving';

        const confidence = Math.round(
          Math.min(100, 35 + v.attempts * 10 + Math.min(25, v.total * 4))
        );

        return {
          id,
          incorrect: Math.round(v.incorrect * 100) / 100,
          total: Math.round(v.total * 100) / 100,
          accuracy,
          confidence,
          evidenceCount: v.attempts,
          lastSeenAt: v.latestAt ? new Date(v.latestAt).toISOString() : null,
          ageDays: v.latestAt
            ? Math.max(0, Math.round((now - v.latestAt) / 86400000))
            : null,
          errorPattern,
        };
      })
      .filter((x) => x.total >= 1 && x.accuracy < 80)
      .sort((a, b) => {
        const rank: Record<DiagnosticErrorPattern, number> = {
          persistent: 0,
          recent: 1,
          new: 2,
          improving: 3,
        };
        return rank[a.errorPattern] - rank[b.errorPattern]
          || a.accuracy - b.accuracy
          || b.confidence - a.confidence;
      })
      .slice(0, 8);

  const vocabularyWeaknesses = build(maps.vocabulary);
  const grammarWeaknesses = build(maps.grammar);
  const weakestVocab = vocabularyWeaknesses[0]?.accuracy ?? 100;
  const weakestGrammar = grammarWeaknesses[0]?.accuracy ?? 100;
  const focus: DiagnosticFocus =
    !vocabularyWeaknesses.length && !grammarWeaknesses.length
      ? 'balanced'
      : weakestVocab + 5 < weakestGrammar
        ? 'vocabulary'
        : weakestGrammar + 5 < weakestVocab
          ? 'grammar'
          : 'quiz';

  const all = [...vocabularyWeaknesses, ...grammarWeaknesses];
  return {
    vocabularyWeaknesses,
    grammarWeaknesses,
    focus,
    confidence: all.length
      ? Math.round(all.reduce((sum, item) => sum + item.confidence, 0) / all.length)
      : 20,
    evidenceCount: all.reduce((sum, item) => sum + item.evidenceCount, 0),
  };
}



export function getDiagnosticFocus(input: Pick<RecommendationDecisionInput, 'vocabularyScore' | 'grammarScore' | 'quizScore' | 'weakVocabularyCount' | 'weakGrammarCount'>): DiagnosticFocus {
  const scores = [
    { key: 'vocabulary' as const, score: input.vocabularyScore, weak: input.weakVocabularyCount },
    { key: 'grammar' as const, score: input.grammarScore, weak: input.weakGrammarCount },
    { key: 'quiz' as const, score: input.quizScore, weak: 0 },
  ].sort((a, b) => a.score - b.score);
  const lowest = scores[0];
  if (lowest.weak > 0 || lowest.score <= scores[1].score - 8) return lowest.key;
  return 'balanced';
}

export interface PersonalizedLearningPlanInput {
  dailyMinutes: number;
  learningGoal: 'conversation' | 'travel' | 'work' | 'exam' | 'culture' | 'general';
  decision: RecommendationDecision;
  completionPercent: number;
  vocabularyScore: number;
  grammarScore: number;
  quizScore: number;
  diagnosticFocus?: DiagnosticFocus;
  momentumScore?: number;
  recentCompletionRate?: number;
  momentumTrend?: 'rising' | 'stable' | 'falling';
  consistencyScore?: number;
  recentOutcomeScore?: number;
  recentOutcomeAgeDays?: number;
}

export interface PersonalizedLearningPlanStep {
  id: 'srs' | 'reinforce' | 'lesson' | 'speaking';
  title: string;
  minutes: number;
  description: string;
  action: 'flashcards' | 'review' | 'lesson' | 'speaking';
}

export interface PersonalizedLearningPlan {
  dailyMinutes: number;
  focus: string;
  difficulty: 'nhẹ' | 'vừa' | 'thách thức';
  newWordsTarget: number;
  quizIntensity: 'nhẹ' | 'chuẩn' | 'tập trung';
  speakingPace: 'chậm' | 'tự nhiên' | 'tăng phản xạ';
  adaptationReason: string;
  steps: PersonalizedLearningPlanStep[];
}

const GOAL_FOCUS: Record<PersonalizedLearningPlanInput['learningGoal'], string> = {
  conversation: 'Phản xạ giao tiếp',
  travel: 'Tình huống du lịch',
  work: 'Tiếng Trung công việc',
  exam: 'Củng cố HSK & làm bài',
  culture: 'Nghe đọc và hiểu văn hóa',
  general: 'Cân bằng 4 kỹ năng',
};

export function buildPersonalizedLearningPlan(
  input: PersonalizedLearningPlanInput
): PersonalizedLearningPlan {
  const momentum = Math.max(0, Math.min(100, input.momentumScore ?? 50));
  const completionRate = Math.max(0, Math.min(100, input.recentCompletionRate ?? 50));
  const adaptiveMinutes = momentum >= 80 && completionRate >= 70
    ? 1.15
    : momentum < 35 || completionRate < 40
      ? 0.85
      : 1;
  const total = Math.max(10, Math.min(180, Math.round((input.dailyMinutes || 15) * adaptiveMinutes)));
  const focus = GOAL_FOCUS[input.learningGoal] || GOAL_FOCUS.general;
  const diagnosticFocus = input.diagnosticFocus || 'balanced';
  const consistency = Math.max(0, Math.min(100, input.consistencyScore ?? 50));
  const recentOutcomeScore = input.recentOutcomeScore == null ? null : Math.max(0, Math.min(100, input.recentOutcomeScore));
  const recentOutcomeIsFresh = (input.recentOutcomeAgeDays ?? 99) <= 3;
  const recentOutcomeIsWeak = recentOutcomeScore !== null && recentOutcomeIsFresh && recentOutcomeScore < 70;
  const recentOutcomeIsStrong = recentOutcomeScore !== null && recentOutcomeIsFresh && recentOutcomeScore >= 90;
  const difficulty: PersonalizedLearningPlan['difficulty'] =
    recentOutcomeIsWeak || momentum < 35 || consistency < 45 || input.quizScore < 65 ? 'nhẹ'
      : (recentOutcomeIsStrong && momentum >= 75 && consistency >= 70 && input.quizScore >= 85) || (momentum >= 80 && consistency >= 70 && input.quizScore >= 85)
        ? 'thách thức'
        : 'vừa';
  const newWordsTarget = difficulty === 'thách thức' ? 12 : difficulty === 'nhẹ' ? 6 : 9;
  const quizIntensity: PersonalizedLearningPlan['quizIntensity'] =
    diagnosticFocus === 'quiz' || input.quizScore < 80 || recentOutcomeIsWeak ? 'tập trung' : input.learningGoal === 'exam' ? 'chuẩn' : 'nhẹ';
  const speakingPace: PersonalizedLearningPlan['speakingPace'] =
    input.learningGoal === 'conversation' || input.learningGoal === 'travel'
      ? (momentum >= 70 ? 'tăng phản xạ' : 'tự nhiên')
      : momentum < 35 ? 'chậm' : 'tự nhiên';

  const weights = input.decision === 'review_srs'
    ? [0.4, 0.3, 0.2, 0.1]
    : input.decision === 'review_quiz'
      ? [0.2, 0.4, 0.3, 0.1]
      : input.decision === 'advance_hsk'
        ? [0.15, 0.2, 0.45, 0.2]
        : [0.2, 0.2, 0.45, 0.15];

  // Personalize the mix without changing any lesson, SRS, or routing contracts.
  const skillWeights = [...weights];
  if (diagnosticFocus === 'vocabulary') {
    skillWeights[0] += 0.10;
    skillWeights[1] -= 0.05;
    skillWeights[2] -= 0.05;
  } else if (diagnosticFocus === 'grammar') {
    skillWeights[1] += 0.10;
    skillWeights[2] -= 0.05;
    skillWeights[3] -= 0.05;
  } else if (diagnosticFocus === 'quiz') {
    skillWeights[1] += 0.05;
    skillWeights[2] += 0.05;
    skillWeights[0] -= 0.05;
    skillWeights[3] -= 0.05;
  }
  if (input.learningGoal === 'conversation' || input.learningGoal === 'travel') skillWeights[3] += 0.05;
  if (input.learningGoal === 'exam') skillWeights[1] += 0.05;
  if (input.momentumTrend === 'falling' || (input.consistencyScore ?? 50) < 45) skillWeights[2] -= 0.05;
  if (input.momentumTrend === 'rising' && (input.consistencyScore ?? 50) >= 70) skillWeights[3] += 0.05;
  const weightTotal = skillWeights.reduce((sum, value) => sum + value, 0);
  const normalizedWeights = skillWeights.map((value) => Math.max(0.05, value / Math.max(weightTotal, 0.01)));

  const raw = normalizedWeights.map((weight) => Math.max(1, Math.round(total * weight)));
  const diff = total - raw.reduce((sum, value) => sum + value, 0);
  raw[2] += diff;

  const outcomeNote = recentOutcomeIsWeak
    ? 'Kết quả gần nhất chưa đạt; Lina giảm tải và tăng phần củng cố.'
    : recentOutcomeIsStrong
      ? 'Kết quả gần nhất rất tốt; Lina có thể tăng nhẹ tải nếu nhịp học vẫn ổn định.'
      : 'Lina giữ tải theo tín hiệu mastery hiện tại.';
  const adaptiveNote = adaptiveMinutes > 1
    ? 'Nhịp học được tăng nhẹ vì tiến độ gần đây ổn định.'
    : adaptiveMinutes < 1
      ? 'Nhịp học được giảm nhẹ để ưu tiên tính đều đặn và tránh quá tải.'
      : 'Giữ nhịp học theo thời lượng bạn đã đặt.';
  const combinedAdaptiveNote = `${adaptiveNote} ${outcomeNote}`;
  const diagnosticDescription = diagnosticFocus === 'vocabulary'
    ? 'AI-9 phát hiện tín hiệu yếu ở từ vựng; ưu tiên từ yếu và ngữ cảnh sử dụng.'
    : diagnosticFocus === 'grammar'
      ? 'AI-9 phát hiện tín hiệu yếu ở ngữ pháp; ưu tiên cấu trúc và lỗi sai.'
      : diagnosticFocus === 'quiz'
        ? 'AI-9 phát hiện kết quả đánh giá chưa ổn định; ưu tiên làm lại quiz có mục tiêu.'
        : 'AI-9 đang cân bằng các tín hiệu mastery hiện tại.';

  const lessonDescription = input.decision === 'advance_hsk'
    ? 'Mở nội dung HSK tiếp theo và duy trì nhịp học mới.'
    : input.completionPercent >= 100
      ? 'Hoàn thiện phần còn yếu trước khi mở rộng nội dung.'
      : 'Học bài tiếp theo theo đúng thứ tự prerequisite.';

  const adaptationReason = difficulty === 'thách thức'
    ? 'Bạn đang giữ nhịp và mastery tốt; Lina tăng nhẹ tải học và tốc độ phản xạ.'
    : difficulty === 'nhẹ'
      ? 'Nhịp gần đây chưa ổn định; Lina giảm tải để ưu tiên hoàn thành đều và củng cố điểm yếu.'
      : 'Nhịp học ổn định; Lina giữ tải vừa và điều chỉnh trọng tâm theo điểm yếu hiện tại.';

  return {
    dailyMinutes: total,
    focus,
    difficulty,
    newWordsTarget,
    quizIntensity,
    speakingPace,
    adaptationReason,
    steps: [
      {
        id: 'srs',
        title: 'Ôn SRS',
        minutes: raw[0],
        description: input.vocabularyScore < 70
          ? `Ưu tiên từ vựng yếu và thẻ đến hạn. ${combinedAdaptiveNote}`
          : `Giữ nhịp ôn cách quãng để không quên từ. ${combinedAdaptiveNote}`,
        action: 'flashcards',
      },
      {
        id: 'reinforce',

        title: 'Củng cố',
        minutes: raw[1],
        description: `${diagnosticFocus === 'grammar'
          ? 'Ôn đúng cấu trúc ngữ pháp có tỷ lệ sai cao nhất.'
          : diagnosticFocus === 'quiz'
            ? 'Làm lại câu hỏi chẩn đoán và sửa lỗi theo từng kỹ năng.'
            : input.grammarScore < 70
              ? 'Ôn ngữ pháp và lỗi thường gặp.'
              : input.quizScore < 80
                ? 'Làm lại quiz và sửa lỗi.'
                : 'Ôn nhanh điểm yếu của cấp độ hiện tại.'}
          ${combinedAdaptiveNote}`,
        action: 'review',
      },
      {
        id: 'lesson',
        title: 'Học bài mới',
        minutes: raw[2],
        description: `${lessonDescription} ${diagnosticDescription}`,
        action: 'lesson',
      },
      {
        id: 'speaking',
        title: 'Speaking',
        minutes: raw[3],
        description: input.learningGoal === 'exam'
          ? 'Luyện nói ngắn để củng cố phản xạ.'
          : `Luyện nói theo mục tiêu: ${focus.toLowerCase()}.`,
        action: 'speaking',
      },
    ],
  };
}

