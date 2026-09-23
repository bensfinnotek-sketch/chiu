import { LearningProgress } from '../../types/progress';
import { supabase } from '../../database/supabaseClient';

export interface ProgressRepository {
  getProgress(userId: string): Promise<LearningProgress>;
  updateProgress(userId: string, updates: Partial<LearningProgress>): Promise<LearningProgress>;
  recordStudyActivity(
    userId: string,
    activity: {
      type: 'lesson' | 'speaking' | 'flashcards';
      durationMinutes?: number;
      wordsLearnedDelta?: number;
    }
  ): Promise<LearningProgress>;
}

export function calculateNewStreak(
  lastStudyDate: string | null,
  currentStreak: number,
  longestStreak: number
): { currentStreak: number; longestStreak: number; newDate: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (!lastStudyDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      newDate: today,
    };
  }

  const last = new Date(lastStudyDate);
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (lastStudyDate === today) {
    return { currentStreak, longestStreak, newDate: today };
  } else if (diffDays === 1) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(longestStreak, nextStreak),
      newDate: today,
    };
  } else {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      newDate: today,
    };
  }
}

export class SupabaseProgressRepository implements ProgressRepository {
  async getProgress(userId: string): Promise<LearningProgress> {
    if (!supabase) return this.getDefaultProgress(userId);

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Không thể tải tiến trình học: ${error.message}`);
    }

    if (!data) {
      return this.updateProgress(userId, this.getDefaultProgress(userId));
    }

    return {
      userId: data.user_id,
      totalStudyMinutes: data.total_study_minutes,
      lessonsCompleted: data.lessons_completed,
      wordsLearned: data.words_learned,
      speakingMinutes: data.speaking_minutes,
      conversationsCompleted: data.conversations_completed,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastStudyDate: data.last_study_date,
      updatedAt: data.updated_at,
    };
  }

  async updateProgress(userId: string, updates: Partial<LearningProgress>): Promise<LearningProgress> {
    if (!supabase) return this.getDefaultProgress(userId);

    const dbUpdates: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (updates.totalStudyMinutes !== undefined) dbUpdates.total_study_minutes = updates.totalStudyMinutes;
    if (updates.lessonsCompleted !== undefined) dbUpdates.lessons_completed = updates.lessonsCompleted;
    if (updates.wordsLearned !== undefined) dbUpdates.words_learned = updates.wordsLearned;
    if (updates.speakingMinutes !== undefined) dbUpdates.speaking_minutes = updates.speakingMinutes;
    if (updates.conversationsCompleted !== undefined) dbUpdates.conversations_completed = updates.conversationsCompleted;
    if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak;
    if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
    if (updates.lastStudyDate !== undefined) dbUpdates.last_study_date = updates.lastStudyDate;

    const { data, error } = await supabase
      .from('learning_progress')
      .upsert(dbUpdates)
      .select()
      .single();

    if (error) {
      throw new Error(`Không thể lưu tiến trình học: ${error.message}`);
    }

    return {
      userId: data.user_id,
      totalStudyMinutes: data.total_study_minutes,
      lessonsCompleted: data.lessons_completed,
      wordsLearned: data.words_learned,
      speakingMinutes: data.speaking_minutes,
      conversationsCompleted: data.conversations_completed,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      lastStudyDate: data.last_study_date,
      updatedAt: data.updated_at,
    };
  }

  async recordStudyActivity(
    userId: string,
    activity: {
      type: 'lesson' | 'speaking' | 'flashcards';
      durationMinutes?: number;
      wordsLearnedDelta?: number;
    }
  ): Promise<LearningProgress> {
    const curr = await this.getProgress(userId);
    const duration = activity.durationMinutes || 5;
    const { currentStreak, longestStreak, newDate } = calculateNewStreak(
      curr.lastStudyDate,
      curr.currentStreak,
      curr.longestStreak
    );

    const updates: Partial<LearningProgress> = {
      totalStudyMinutes: curr.totalStudyMinutes + duration,
      currentStreak,
      longestStreak,
      lastStudyDate: newDate,
    };

    if (activity.type === 'lesson') {
      updates.lessonsCompleted = curr.lessonsCompleted + 1;
    } else if (activity.type === 'speaking') {
      updates.speakingMinutes = curr.speakingMinutes + duration;
      updates.conversationsCompleted = curr.conversationsCompleted + 1;
    }

    if (activity.wordsLearnedDelta) {
      updates.wordsLearned = curr.wordsLearned + activity.wordsLearnedDelta;
    }

    return this.updateProgress(userId, updates);
  }

  private getDefaultProgress(userId: string): LearningProgress {
    return {
      userId,
      totalStudyMinutes: 0,
      lessonsCompleted: 0,
      wordsLearned: 0,
      speakingMinutes: 0,
      conversationsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      updatedAt: new Date().toISOString(),
    };
  }
}

export class LocalStorageProgressRepository implements ProgressRepository {
  private getStorageKey(userId: string) {
    return `hanzi_ai_progress_${userId}`;
  }

  async getProgress(userId: string): Promise<LearningProgress> {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    const def = this.getDefaultProgress(userId);
    await this.updateProgress(userId, def);
    return def;
  }

  async updateProgress(userId: string, updates: Partial<LearningProgress>): Promise<LearningProgress> {
    const existing = await this.getProgress(userId);
    const updated: LearningProgress = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  }

  async recordStudyActivity(
    userId: string,
    activity: {
      type: 'lesson' | 'speaking' | 'flashcards';
      durationMinutes?: number;
      wordsLearnedDelta?: number;
    }
  ): Promise<LearningProgress> {
    const curr = await this.getProgress(userId);
    const duration = activity.durationMinutes || 5;
    const { currentStreak, longestStreak, newDate } = calculateNewStreak(
      curr.lastStudyDate,
      curr.currentStreak,
      curr.longestStreak
    );

    const updates: Partial<LearningProgress> = {
      totalStudyMinutes: curr.totalStudyMinutes + duration,
      currentStreak,
      longestStreak,
      lastStudyDate: newDate,
    };

    if (activity.type === 'lesson') {
      updates.lessonsCompleted = curr.lessonsCompleted + 1;
    } else if (activity.type === 'speaking') {
      updates.speakingMinutes = curr.speakingMinutes + duration;
      updates.conversationsCompleted = curr.conversationsCompleted + 1;
    }

    if (activity.wordsLearnedDelta) {
      updates.wordsLearned = curr.wordsLearned + activity.wordsLearnedDelta;
    }

    return this.updateProgress(userId, updates);
  }

  private getDefaultProgress(userId: string): LearningProgress {
    return {
      userId,
      totalStudyMinutes: 0,
      lessonsCompleted: 0,
      wordsLearned: 0,
      speakingMinutes: 0,
      conversationsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      updatedAt: new Date().toISOString(),
    };
  }
}
