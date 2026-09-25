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
  // Progress dates are stored as YYYY-MM-DD. Compare calendar dates directly
  // instead of mixing UTC timestamps with local calendar days; otherwise a
  // study session around midnight/time-zone boundaries can incorrectly break
  // or extend a streak.
  const today = new Date().toISOString().slice(0, 10);

  if (!lastStudyDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      newDate: today,
    };
  }

  const parseCalendarDate = (value: string): number | null => {
    const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const timestamp = Date.UTC(year, month - 1, day);

    // Reject impossible dates such as 2026-02-31.
    const parsed = new Date(timestamp);
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }

    return timestamp;
  };

  const todayTimestamp = parseCalendarDate(today);
  const lastTimestamp = parseCalendarDate(lastStudyDate);

  // Invalid or future stored dates should not grant an extra streak day.
  if (todayTimestamp === null || lastTimestamp === null || lastTimestamp > todayTimestamp) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      newDate: today,
    };
  }

  const diffDays = Math.round((todayTimestamp - lastTimestamp) / 86_400_000);

  if (diffDays === 0) {
    return { currentStreak, longestStreak, newDate: today };
  }

  if (diffDays === 1) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(longestStreak, nextStreak),
      newDate: today,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    newDate: today,
  };
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
      // Keep reads side-effect free. A missing row is represented in memory;
      // it will be persisted on the next explicit progress update.
      return this.getDefaultProgress(userId);
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
      .upsert(dbUpdates, { onConflict: 'user_id' })
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
      // ignore malformed/unavailable local progress and fall back to defaults
    }

    // Do not call updateProgress() here: updateProgress() reads through
    // getProgress(), so doing so would recurse indefinitely when no local
    // progress exists and eventually throw "Maximum call stack size exceeded".
    return this.getDefaultProgress(userId);
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
