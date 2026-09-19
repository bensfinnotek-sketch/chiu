export type SupportedLanguage = 'vi' | 'en' | 'zh';

export type HSKLevel = 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5' | 'HSK 6';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  chineseLevel: HSKLevel;
  targetHsk: HSKLevel;
  learningGoal: 'travel' | 'work' | 'school' | 'hsk' | 'conversation' | 'personal';
  dailyMinutes: number;
  nativeLanguage: SupportedLanguage;
  streakDays: number;
  wordsLearned: number;
  minutesLearnedToday: number;
  isPremium: boolean;
  joinedDate: string;
}

export interface VocabularyItem {
  id: string;
  hanzi?: string;
  chinese?: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string;
  partOfSpeech?: string;
  hskLevel?: HSKLevel | string;
  exampleChinese?: string;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleVi?: string;
  exampleTranslationVi?: string;
  exampleEn?: string;
  audioUrl?: string;
  state?: 'new' | 'learning' | 'review' | 'mastered';
  reviewCount?: number;
  lastReviewed?: string;
}

export interface LessonSection {
  id: string;
  type: 'vocabulary' | 'grammar' | 'dialogue' | 'quiz' | 'speaking';
  title: string;
  description?: string;
  items?: any[];
}

export interface DialogueExchange {
  speaker: 'lina' | 'user';
  chinese: string;
  pinyin: string;
  vi: string;
  en: string;
  audio?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  pinyin?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  level: HSKLevel;
  lessonNumber: number;
  title: string;
  titleVi: string;
  descriptionVi: string;
  icon: string;
  durationMinutes: number;
  objectivesVi: string[];
  vocabulary: VocabularyItem[];
  dialogue: DialogueExchange[];
  quiz: QuizQuestion[];
  isCompleted?: boolean;
  progressPercent?: number;
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'lina';
  chinese: string;
  pinyin?: string;
  translation?: string;
  timestamp: string;
  correction?: {
    hasMistake?: boolean;
    userSentence?: string;
    naturalVersion?: string;
    betterChinese?: string;
    pinyin?: string;
    explanation?: string;
    explanationVi?: string;
  };
  detectedVocabulary?: Array<{
    hanzi: string;
    pinyin: string;
    meaning: string;
    hsk?: string;
  }>;
  grammarNote?: string;
  encouragement?: string;
  followUpQuestion?: string;
  scores?: {
    clarity: number;
    grammar: number;
    vocabulary: number;
    naturalness: number;
  };
  isSaved?: boolean;
}

export interface SpeakingFeedback {
  pronunciationScore: number;
  grammarScore: number;
  naturalnessScore: number;
  feedback: string;
  suggestedImprovement: string;
}

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  hskLevel: HSKLevel;
  duration: string;
  lyrics: {
    time: number;
    chinese: string;
    pinyin: string;
    translationVi: string;
  }[];
}

export interface TranslationResult {
  translation: string;
  pinyin: string;
  explanation: string;
  naturalAlternatives: {
    text: string;
    pinyin: string;
    note: string;
  }[];
  formal?: { text: string; pinyin?: string };
  casual?: { text: string; pinyin?: string };
}

export interface DictionaryEntry {
  word: string;
  pinyin: string;
  meaning: string;
  hskLevel: HSKLevel;
  partOfSpeech: string;
  radical?: string;
  strokeCount?: number;
  examples: {
    chinese: string;
    pinyin: string;
    meaning: string;
  }[];
  relatedWords: {
    word: string;
    pinyin: string;
    meaning: string;
  }[];
}
