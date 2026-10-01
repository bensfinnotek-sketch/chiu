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

export interface LearnerProfile {
  id: string;
  displayName: string;
  nativeLanguage: string;
  targetLanguage: string;
  currentLevel: string;
  hskLevel: number;
  pinyinLevel: PinyinDisplay;
  learningGoal: string;
  dailyGoalMinutes: number;
  streak: number;
  totalStudyMinutes: number;
  vocabularyStats: { learned: number; mastered: number; weak: number };
  grammarStats: { practiced: number; weak: number };
  pronunciationStats: { practiced: number; weakTones: string[] };
  speakingStats: { sessions: number; confidence: number };
  listeningStats: { sessions: number; accuracy: number };
  readingStats: { sessions: number; accuracy: number };
  writingStats: { sessions: number; accuracy: number };
  weakAreas: string[];
  strongAreas: string[];
  recentLessons: string[];
  recentMistakes: string[];
  preferredTopics: string[];
  lastActiveAt: string;
}

export interface AIMemoryEntry {
  id: string;
  kind: 'learner-fact'|'learning-history'|'mistake'|'mastered-vocabulary'|'weak-vocabulary'|'grammar-weakness'|'pronunciation-weakness'|'conversation-summary'|'goal'|'preference';
  content: string;
  relatedVocabulary?: string[];
  relatedGrammar?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IntelligentMistake extends MistakeRecord {
  mistakeId: string;
  originalInput: string;
  correctedInput: string;
  severity: 'low'|'medium'|'high';
  firstSeen: string;
  resolved: boolean;
  relatedVocabulary: string[];
  relatedGrammar: string[];
  relatedPronunciation: string[];
  priority: number;
}

export interface DailyPersonalizedPlan extends DailyPlan {
  reviewMinutes: number;
  weakVocabulary: string[];
  grammarPoint: string | null;
  pronunciationMinutes: number;
  conversationMinutes: number;
  miniQuiz: boolean;
  reason: string;
}

export interface TutorContext {
  learner: LearnerProfile;
  relevantMemory: AIMemoryEntry[];
  relevantMistakes: IntelligentMistake[];
  currentLesson?: StructuredLesson | null;
  currentConversation: string[];
  difficulty: 1|2|3|4|5;
}


export type LessonType = 'vocabulary'|'grammar'|'listening'|'speaking'|'reading'|'writing'|'conversation'|'review'|'mixed';

export interface LessonQuizQuestion {
  id:string;
  type:'multiple-choice'|'translation'|'fill-blank'|'reorder'|'listen-choose'|'listen-type'|'speaking'|'matching';
  question:string;
  options:string[];
  answer:string;
  explanation:string;
  difficulty:1|2|3|4|5;
  skill:'vocabulary'|'grammar'|'listening'|'speaking'|'reading'|'writing';
  relatedVocabulary:string[];
  relatedGrammar:string[];
}

export interface LessonSchema {
  id:string;
  title:string;
  description:string;
  hskLevel:number|null;
  level:string;
  objectives:string[];
  vocabulary:Vocabulary[];
  grammar:GrammarRecord[];
  dialogue:LessonDialogueTurn[];
  listening:string[];
  speaking:string[];
  reading:string[];
  writing:string[];
  roleplay:{title:string;scenario:string;prompt:string;expectedPatterns:string[]};
  quiz:LessonQuizQuestion[];
  review:ReviewType[];
  estimatedMinutes:number;
  lessonType:LessonType;
}

export interface LessonGenerationParameters {
  level:string;
  topic:string;
  goal:string;
  duration:number;
  learnerWeaknesses:string[];
  targetVocabulary:string[];
  targetGrammar:string[];
}


export type MotivationActivity='lesson'|'review'|'speaking'|'conversation'|'pronunciation'|'daily-goal';
export interface DailyGoal { minutes:number; lessons:number; vocabulary:number; speaking:number; review:number; selectedMinutes:5|10|15|20|30; date:string; }
export interface MotivationSnapshot {
  date:string; timezone:string; minutes:number; lessons:number; vocabulary:number; speaking:number; review:number; xp:number; completedXpEvents:string[]; active:boolean;
}
export interface Achievement { id:string; title:string; description:string; unlocked:boolean; unlockedAt?:string; }
export interface WeeklySummary { minutesStudied:number; lessonsCompleted:number; wordsReviewed:number; speakingSessions:number; commonMistakes:string[]; nextRecommendedPractice:string; }
