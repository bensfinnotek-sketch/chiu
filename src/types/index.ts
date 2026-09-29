export type SupportedLanguage = 'vi';

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