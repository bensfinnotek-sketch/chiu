import type { Vocabulary, UserProfile } from '../types';

export type PinyinDisplay = 'marks' | 'numbers' | 'hidden';
export type ReviewType = 'zh-vi' | 'vi-zh' | 'audio-meaning' | 'pinyin-zh' | 'zh-speak' | 'listen-repeat' | 'fill-blank' | 'conversation';
export type MistakeType = 'grammar' | 'vocabulary' | 'pronunciation' | 'tone' | 'word-order';

export interface GrammarRecord {
  id: string;
  pattern: string;
  meaning: string;
  explanationVi: string;
  examples: Array<{ chinese: string; pinyin: string; vietnamese: string }>;
  commonMistakes: string[];
  practiceQuestions: string[];
}

export interface LessonDialogueTurn {
  speaker: 'ai' | 'learner';
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface StructuredLesson {
  id: string;
  hskLevel: number;
  lessonNumber: number;
  title: string;
  objective: string;
  vocabulary: Vocabulary[];
  grammar: GrammarRecord[];
  dialogue: LessonDialogueTurn[];
  listening: string[];
  speaking: string[];
  roleplay: { title: string; scenario: string; prompt: string; expectedPatterns: string[] };
  review: ReviewType[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface HskPath {
  level: number;
  title: string;
  status: 'active' | 'planned';
  lessonIds: string[];
}

export interface ReviewItem {
  id: string;
  vocabularyId: string;
  lastReviewed: string | null;
  nextReview: string;
  interval: number;
  ease: number;
  correctCount: number;
  incorrectCount: number;
  mastery: number;
}

export interface MistakeRecord {
  id: string;
  type: MistakeType;
  original: string;
  corrected: string;
  explanation: string;
  frequency: number;
  lastSeen: string;
  mastery: number;
}

export interface LearnerMemory {
  level: string;
  goal: string;
  dailyMinutes: number;
  weakGrammar: string[];
  weakVocabulary: string[];
  weakTones: string[];
  preferredTopics: string[];
  recentMistakes: string[];
}

export interface LearningProgress {
  lessonProgress: Record<string, number>;
  completedLessons: string[];
  speakingPractice: number;
  listeningPractice: number;
  grammarPractice: number;
  pronunciationPractice: number;
  tonePractice: number;
  reviewsCompleted: number;
  streak: number;
}

export interface DailyPlan {
  minutes: number;
  lessonId: string;
  reviewCount: number;
  speakingCount: number;
  newWords: number;
  grammarPoints: number;
}

export const defaultLearnerMemory = (profile: UserProfile): LearnerMemory => ({
  level: profile.currentHsk ? `HSK${profile.currentHsk}` : 'HSK1',
  goal: profile.goal,
  dailyMinutes: profile.dailyMinutes,
  weakGrammar: [],
  weakVocabulary: [],
  weakTones: [],
  preferredTopics: ['daily life', 'conversation'],
  recentMistakes: [],
});
