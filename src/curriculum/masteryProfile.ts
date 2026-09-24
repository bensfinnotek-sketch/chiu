import {
  HSKLevelNumber,
  QuizAttempt,
  UserGrammarProgress,
  UserSkillProgress,
  UserVocabularyProgress,
} from '../types/curriculum';

export type MasteryLabel = 'needs_review' | 'developing' | 'solid' | 'strong';

export interface HSKMasteryProfile {
  level: HSKLevelNumber;
  overallScore: number;
  label: MasteryLabel;
  vocabularyScore: number;
  grammarScore: number;
  quizScore: number;
  weakVocabularyCount: number;
  weakGrammarCount: number;
  quizAttempts: number;
  evidenceCount: number;
}

export interface MasteryProfileInput {
  vocabulary: UserVocabularyProgress[];
  grammar: UserGrammarProgress[];
  quizAttempts: QuizAttempt[];
  skillProgress?: UserSkillProgress[];
  vocabularyLevels: Map<string, HSKLevelNumber>;
  grammarLevels: Map<string, HSKLevelNumber>;
  lessonLevels: Map<string, HSKLevelNumber>;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function labelFor(score: number): MasteryLabel {
  if (score < 40) return 'needs_review';
  if (score < 60) return 'developing';
  if (score < 80) return 'solid';
  return 'strong';
}

function normalizedScore(values: number[], fallback: number): number {
  return values.length > 0 ? average(values) : fallback;
}

/**
 * Builds a live HSK mastery profile from the learner's strongest evidence:
 * per-word mastery, per-grammar-point mastery, and quiz performance.
 *
 * Vocabulary/grammar are weighted more heavily than quiz attempts because
 * they represent repeated skill evidence rather than a single assessment.
 * Legacy aggregate skill scores are used only when there is no level-specific
 * progress record at all, so an unexposed word/grammar record cannot inherit
 * an unrelated aggregate score.
 */
export function buildHskMasteryProfile(input: MasteryProfileInput): HSKMasteryProfile[] {
  const profiles: HSKMasteryProfile[] = [];

  for (const level of [1, 2, 3, 4, 5, 6] as HSKLevelNumber[]) {
    const levelVocabularyProgress = input.vocabulary.filter(
      (item) => input.vocabularyLevels.get(item.vocabularyId) === level
    );
    const levelGrammarProgress = input.grammar.filter(
      (item) => input.grammarLevels.get(item.grammarPointId) === level
    );
    const vocabulary = levelVocabularyProgress.filter((item) => item.exposureCount > 0);
    const grammar = levelGrammarProgress.filter((item) => item.exposureCount > 0);
    const quizzes = input.quizAttempts.filter(
      (attempt) => input.lessonLevels.get(attempt.lessonId) === level
    );

    const skillEvidence = input.skillProgress?.filter((skill) => skill.level === level) || [];
    const vocabularySkill = skillEvidence.find((skill) => skill.skill === 'vocabulary');
    const grammarSkill = skillEvidence.find((skill) => skill.skill === 'grammar');

    const vocabularyScore = normalizedScore(
      vocabulary.map((item) => item.masteryScore),
      levelVocabularyProgress.length === 0 ? (vocabularySkill?.score ?? 0) : 0
    );
    const grammarScore = normalizedScore(
      grammar.map((item) => item.masteryScore),
      levelGrammarProgress.length === 0 ? (grammarSkill?.score ?? 0) : 0
    );
    const quizScore = average(quizzes.map((attempt) => attempt.score));

    // With no quiz attempts, do not let the missing assessment drag down the
    // profile. Once quiz evidence exists it contributes 25% to the level score.
    const overallScore = quizzes.length > 0
      ? Math.round(vocabularyScore * 0.45 + grammarScore * 0.30 + quizScore * 0.25)
      : Math.round(vocabularyScore * 0.60 + grammarScore * 0.40);

    profiles.push({
      level,
      overallScore: Math.max(0, Math.min(100, overallScore)),
      label: labelFor(overallScore),
      vocabularyScore,
      grammarScore,
      quizScore,
      weakVocabularyCount: vocabulary.filter((item) => item.masteryScore < 60).length,
      weakGrammarCount: grammar.filter((item) => item.masteryScore < 60).length,
      quizAttempts: quizzes.length,
      evidenceCount: vocabulary.length + grammar.length + quizzes.length,
    });
  }

  return profiles;
}

export function getMasteryLabelVi(label: MasteryLabel): string {
  switch (label) {
    case 'strong':
      return 'vững';
    case 'solid':
      return 'khá vững';
    case 'developing':
      return 'đang phát triển';
    case 'needs_review':
      return 'cần ôn lại';
  }
}

export function getHskMasteryProfile(
  profiles: HSKMasteryProfile[],
  level: HSKLevelNumber
): HSKMasteryProfile {
  return profiles.find((profile) => profile.level === level) || {
    level,
    overallScore: 0,
    label: 'needs_review',
    vocabularyScore: 0,
    grammarScore: 0,
    quizScore: 0,
    weakVocabularyCount: 0,
    weakGrammarCount: 0,
    quizAttempts: 0,
    evidenceCount: 0,
  };
}
