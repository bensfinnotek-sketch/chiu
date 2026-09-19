import { UserVocabulary } from '../../types/vocabulary';
import { supabase } from '../../database/supabaseClient';

export interface VocabularyRepository {
  getUserVocabulary(userId: string): Promise<UserVocabulary[]>;
  addWord(
    userId: string,
    word: { hanzi: string; pinyin: string; meaning: string; hskLevel?: number }
  ): Promise<UserVocabulary>;
  updateWordStatus(id: string, status: 'new' | 'learning' | 'learned'): Promise<void>;
  recordReview(id: string, success: boolean): Promise<void>;
}

export class SupabaseVocabularyRepository implements VocabularyRepository {
  async getUserVocabulary(userId: string): Promise<UserVocabulary[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      hanzi: row.hanzi,
      pinyin: row.pinyin,
      meaning: row.meaning,
      hskLevel: row.hsk_level,
      status: row.status as any,
      reviewCount: row.review_count,
      lastReviewedAt: row.last_reviewed_at,
      nextReviewAt: row.next_review_at,
      createdAt: row.created_at,
    }));
  }

  async addWord(
    userId: string,
    word: { hanzi: string; pinyin: string; meaning: string; hskLevel?: number }
  ): Promise<UserVocabulary> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert({
        user_id: userId,
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        meaning: word.meaning,
        hsk_level: word.hskLevel || 1,
        status: 'new',
        review_count: 0,
        last_reviewed_at: null,
        next_review_at: now,
        created_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      hanzi: data.hanzi,
      pinyin: data.pinyin,
      meaning: data.meaning,
      hskLevel: data.hsk_level,
      status: data.status as any,
      reviewCount: data.review_count,
      lastReviewedAt: data.last_reviewed_at,
      nextReviewAt: data.next_review_at,
      createdAt: data.created_at,
    };
  }

  async updateWordStatus(id: string, status: 'new' | 'learning' | 'learned'): Promise<void> {
    if (!supabase) return;
    await supabase.from('user_vocabulary').update({ status }).eq('id', id);
  }

  async recordReview(id: string, success: boolean): Promise<void> {
    if (!supabase) return;
    const now = new Date().toISOString();
    const nextDays = success ? 3 : 1;
    const nextDate = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('user_vocabulary')
      .select('review_count')
      .eq('id', id)
      .single();

    const count = (data?.review_count || 0) + 1;
    await supabase
      .from('user_vocabulary')
      .update({
        review_count: count,
        last_reviewed_at: now,
        next_review_at: nextDate,
        status: count >= 3 ? 'learned' : 'learning',
      })
      .eq('id', id);
  }
}

export class LocalStorageVocabularyRepository implements VocabularyRepository {
  private getStorageKey(userId: string) {
    return `hanzi_ai_user_vocab_${userId}`;
  }

  private getList(userId: string): UserVocabulary[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveList(userId: string, list: UserVocabulary[]): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  async getUserVocabulary(userId: string): Promise<UserVocabulary[]> {
    return this.getList(userId);
  }

  async addWord(
    userId: string,
    word: { hanzi: string; pinyin: string; meaning: string; hskLevel?: number }
  ): Promise<UserVocabulary> {
    const list = this.getList(userId);
    const now = new Date().toISOString();
    const newWord: UserVocabulary = {
      id: `vocab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      meaning: word.meaning,
      hskLevel: word.hskLevel || 1,
      status: 'new',
      reviewCount: 0,
      lastReviewedAt: null,
      nextReviewAt: now,
      createdAt: now,
    };
    this.saveList(userId, [newWord, ...list]);
    return newWord;
  }

  async updateWordStatus(id: string, status: 'new' | 'learning' | 'learned'): Promise<void> {
    // Search across user's keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('hanzi_ai_user_vocab_')) {
        try {
          const list: UserVocabulary[] = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = list.findIndex((item) => item.id === id);
          if (idx >= 0) {
            list[idx].status = status;
            localStorage.setItem(key, JSON.stringify(list));
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  async recordReview(id: string, success: boolean): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('hanzi_ai_user_vocab_')) {
        try {
          const list: UserVocabulary[] = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = list.findIndex((item) => item.id === id);
          if (idx >= 0) {
            const count = (list[idx].reviewCount || 0) + 1;
            const nextDays = success ? 3 : 1;
            list[idx].reviewCount = count;
            list[idx].lastReviewedAt = new Date().toISOString();
            list[idx].nextReviewAt = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString();
            list[idx].status = count >= 3 ? 'learned' : 'learning';
            localStorage.setItem(key, JSON.stringify(list));
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }
}
