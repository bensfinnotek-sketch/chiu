import { UserProfile } from '../../types/user';
import { supabase } from '../../database/supabaseClient';
import { DEFAULT_USER_PROFILE, createInitialUserProfile } from '../../config/defaultUserProfile';

export interface UserRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  createProfile(profile: UserProfile): Promise<void>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
}

export class SupabaseUserRepository implements UserRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching Supabase profile:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      nativeLanguage: data.native_language,
      targetLanguage: data.target_language,
      hskLevel: data.hsk_level,
      learningGoal: data.learning_goal as any,
      dailyMinutes: data.daily_minutes,
      speakingLevel: data.speaking_level,
      listeningLevel: data.listening_level,
      readingLevel: data.reading_level,
      writingLevel: data.writing_level,
      showPinyin: data.show_pinyin,
      showTranslation: data.show_translation,
      preferredVoice: data.preferred_voice,
      speechSpeed: data.speech_speed,
      onboardingCompleted: data.onboarding_completed,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createProfile(profile: UserProfile): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      native_language: profile.nativeLanguage,
      target_language: profile.targetLanguage,
      hsk_level: profile.hskLevel,
      learning_goal: profile.learningGoal,
      daily_minutes: profile.dailyMinutes,
      speaking_level: profile.speakingLevel,
      listening_level: profile.listeningLevel,
      reading_level: profile.readingLevel,
      writing_level: profile.writingLevel,
      show_pinyin: profile.showPinyin,
      show_translation: profile.showTranslation,
      preferred_voice: profile.preferredVoice,
      speech_speed: profile.speechSpeed,
      onboarding_completed: profile.onboardingCompleted,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.nativeLanguage !== undefined) dbUpdates.native_language = updates.nativeLanguage;
    if (updates.targetLanguage !== undefined) dbUpdates.target_language = updates.targetLanguage;
    if (updates.hskLevel !== undefined) dbUpdates.hsk_level = updates.hskLevel;
    if (updates.learningGoal !== undefined) dbUpdates.learning_goal = updates.learningGoal;
    if (updates.dailyMinutes !== undefined) dbUpdates.daily_minutes = updates.dailyMinutes;
    if (updates.speakingLevel !== undefined) dbUpdates.speaking_level = updates.speakingLevel;
    if (updates.listeningLevel !== undefined) dbUpdates.listening_level = updates.listeningLevel;
    if (updates.readingLevel !== undefined) dbUpdates.reading_level = updates.readingLevel;
    if (updates.writingLevel !== undefined) dbUpdates.writing_level = updates.writingLevel;
    if (updates.showPinyin !== undefined) dbUpdates.show_pinyin = updates.showPinyin;
    if (updates.showTranslation !== undefined) dbUpdates.show_translation = updates.showTranslation;
    if (updates.preferredVoice !== undefined) dbUpdates.preferred_voice = updates.preferredVoice;
    if (updates.speechSpeed !== undefined) dbUpdates.speech_speed = updates.speechSpeed;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      nativeLanguage: data.native_language,
      targetLanguage: data.target_language,
      hskLevel: data.hsk_level,
      learningGoal: data.learning_goal as any,
      dailyMinutes: data.daily_minutes,
      speakingLevel: data.speaking_level,
      listeningLevel: data.listening_level,
      readingLevel: data.reading_level,
      writingLevel: data.writing_level,
      showPinyin: data.show_pinyin,
      showTranslation: data.show_translation,
      preferredVoice: data.preferred_voice,
      speechSpeed: data.speech_speed,
      onboardingCompleted: data.onboarding_completed,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export class LocalStorageUserRepository implements UserRepository {
  private getStorageKey(userId: string) {
    return `hanzi_ai_profile_${userId}`;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return null;
  }

  async createProfile(profile: UserProfile): Promise<void> {
    try {
      localStorage.setItem(this.getStorageKey(profile.id), JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    let existing = await this.getProfile(userId);
    if (!existing) {
      existing = createInitialUserProfile(userId, 'user@local.dev');
    }
    const updated: UserProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.createProfile(updated);
    return updated;
  }
}
