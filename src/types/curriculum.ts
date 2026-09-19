// Curriculum & HSK Types for HanziAI Platform
// Versioned, schema-driven, HSK-aligned structure

export type HSKLevelNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface Curriculum {
  id: string;
  name: string;
  version: string; // e.g. "hsk-3.0"
  language: string; // 'vi'
  targetLanguage: string; // 'zh-CN'
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HSKLevelInfo {
  id: string;
  level: HSKLevelNumber;
  title: string;
  nameZh: string;
  descriptionVi: string;
  objectives: string[];
  estimatedHours: number;
  totalLessons: number;
  totalUnits: number;
  totalVocabulary: number;
  totalGrammarPoints: number;
  prerequisites?: HSKLevelNumber[];
  order: number;
}

export interface CurriculumUnit {
  id: string;
  curriculumId: string;
  levelId: string;
  levelNumber: HSKLevelNumber;
  order: number;
  title: string;
  titleZh: string;
  description: string;
  objectives: string[];
  estimatedMinutes: number;
  lessonCount: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type LessonDifficulty = 'easy' | 'medium' | 'hard';
export type LessonStatus = 'draft' | 'published' | 'archived';

export interface Lesson {
  id: string;
  unitId: string;
  levelId: string;
  levelNumber: HSKLevelNumber;
  order: number;
  slug: string;
  title: string;
  titleZh: string;
  description: string;
  objectives: string[];
  estimatedMinutes: number;
  difficulty: LessonDifficulty;
  status: LessonStatus;
  isPublished: boolean;
  isRequired: boolean;
  prerequisiteLessonId?: string | null;
  completionRule: 'all_required_sections' | 'quiz_pass' | 'all_required_and_quiz';
  passingScore: number; // default 80
  createdAt: string;
  updatedAt: string;
}

export type LessonSectionType =
  | 'intro'
  | 'vocabulary'
  | 'grammar'
  | 'dialogue'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'practice'
  | 'quiz'
  | 'review'
  | 'summary';

export interface LessonSection {
  id: string;
  lessonId: string;
  order: number;
  type: LessonSectionType;
  title: string;
  content: any;
  estimatedMinutes: number;
  isRequired: boolean;
}

export interface DialogueLine {
  id: string;
  speaker: string; // e.g. 'Lina 老师', 'Học viên', 'Tiểu Minh'
  chinese: string;
  pinyin: string;
  translationVi: string;
  audioUrl?: string | null;
}

export interface Vocabulary {
  id: string;
  hanzi: string;
  traditional?: string | null;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string | null;
  partOfSpeech?: string | null;
  hskLevel: HSKLevelNumber;
  frequency?: number | null;
  exampleSentence?: string | null;
  examplePinyin?: string | null;
  exampleTranslation?: string | null;
  audioUrl?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonVocabulary {
  lessonId: string;
  vocabularyId: string;
  order: number;
  isCore: boolean;
}

export interface GrammarExample {
  chinese: string;
  pinyin: string;
  translationVi: string;
  explanation?: string;
}

export interface GrammarPoint {
  id: string;
  level: HSKLevelNumber;
  title: string;
  pattern: string;
  explanationVi: string;
  explanationEn?: string | null;
  examples: GrammarExample[];
  commonMistakes?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

export type QuizQuestionType =
  | 'multiple_choice'
  | 'translation'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'listening'
  | 'reading'
  | 'speaking'
  | 'true_false';

export interface QuizOption {
  id: string;
  text: string;
  pinyin?: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  lessonId: string;
  type: QuizQuestionType;
  order: number;
  question: string;
  questionPinyin?: string | null;
  audioUrl?: string | null;
  passage?: string | null; // For reading comprehension
  options?: QuizOption[];
  correctAnswer: string | string[]; // Single id/text or array for ordering/multi
  explanation?: string | null;
  vocabularyIds?: string[];
  grammarPointIds?: string[];
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpentSeconds?: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  score: number; // percentage 0-100
  totalPoints: number;
  earnedPoints: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  answers: QuizAnswer[];
  startedAt: string;
  completedAt: string;
}

// User Progression Interfaces
export type LessonProgressStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface UserLessonProgress {
  userId: string;
  lessonId: string;
  levelNumber: HSKLevelNumber;
  status: LessonProgressStatus;
  progressPercent: number;
  currentSectionId?: string | null;
  score?: number | null;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  lastAccessedAt: string;
}

export interface UserVocabularyProgress {
  userId: string;
  vocabularyId: string;
  status: 'new' | 'learning' | 'known' | 'mastered';
  exposureCount: number;
  correctCount: number;
  incorrectCount: number;
  lastSeenAt: string | null;
  masteredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserGrammarProgress {
  userId: string;
  grammarPointId: string;
  exposureCount: number;
  correctCount: number;
  incorrectCount: number;
  masteryScore: number; // 0-100
  lastPracticedAt: string | null;
}

export type SkillType = 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing';

export interface UserSkillProgress {
  userId: string;
  skill: SkillType;
  level: HSKLevelNumber;
  score: number; // 0-100
  completedActivities: number;
  updatedAt: string;
}

export interface HSKLevelCompletion {
  userId: string;
  level: HSKLevelNumber;
  completionPercent: number;
  completedLessons: number;
  totalRequiredLessons: number;
  averageQuizScore: number;
  completedAt?: string | null;
}

export interface PlacementResult {
  userId: string;
  recommendedLevel: HSKLevelNumber;
  vocabularyScore: number;
  grammarScore: number;
  readingScore: number;
  listeningScore: number;
  completedAt: string;
}

export interface LearningRecommendation {
  type: 'continue_lesson' | 'review_vocabulary' | 'review_grammar' | 'retry_quiz' | 'next_lesson';
  title: string;
  description: string;
  targetId: string;
  priority: number;
  actionText: string;
  metadata?: {
    levelNumber?: HSKLevelNumber;
    score?: number;
    wordCount?: number;
  };
}
