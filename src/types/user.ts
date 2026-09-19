export type LearningGoal =
  | 'conversation'
  | 'travel'
  | 'work'
  | 'exam'
  | 'culture'
  | 'general';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;

  nativeLanguage: string;
  targetLanguage: string;

  hskLevel: number; // 1 to 6
  learningGoal: LearningGoal;
  dailyMinutes: number;

  speakingLevel: number;
  listeningLevel: number;
  readingLevel: number;
  writingLevel: number;

  showPinyin: boolean;
  showTranslation: boolean;

  preferredVoice: string | null;
  speechSpeed: number;

  onboardingCompleted: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInfo {
  userId: string;
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'trialing' | 'cancelled';
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}
