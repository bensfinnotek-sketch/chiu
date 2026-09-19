import { UserProfile } from '../types/user';

export const DEFAULT_USER_PROFILE: Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'> = {
  displayName: null,
  avatarUrl: null,
  nativeLanguage: 'vi',
  targetLanguage: 'zh-CN',
  hskLevel: 1,
  learningGoal: 'conversation',
  dailyMinutes: 15,
  speakingLevel: 1,
  listeningLevel: 1,
  readingLevel: 1,
  writingLevel: 1,
  showPinyin: true,
  showTranslation: true,
  preferredVoice: 'Lina',
  speechSpeed: 1.0,
  onboardingCompleted: false,
};

export function createInitialUserProfile(id: string, email: string, displayName?: string | null, avatarUrl?: string | null): UserProfile {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_USER_PROFILE,
    id,
    email,
    displayName: displayName || email.split('@')[0] || 'Learner',
    avatarUrl: avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  };
}
