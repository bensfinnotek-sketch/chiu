import { ConversationSession, ConversationMessage, ConversationMemory } from '../../types/conversation';
import { supabase } from '../../database/supabaseClient';

function formatSupabaseError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter((value) => typeof value === 'string' && value.trim())
      .map((value) => String(value));
    if (parts.length > 0) return parts.join(' | ');
    try { return JSON.stringify(error); } catch { return 'Lỗi Supabase không xác định.'; }
  }
  return String(error || 'Lỗi Supabase không xác định.');
}

export interface ConversationRepository {
  createSession(userId: string, topic: string, level: string | number, title?: string): Promise<ConversationSession>;
  getSession(sessionId: string): Promise<ConversationSession | null>;
  getUserSessions(userId: string): Promise<ConversationSession[]>;
  saveMessage(sessionId: string, userId: string, message: ConversationMessage): Promise<void>;
  getSessionMessages(sessionId: string): Promise<ConversationMessage[]>;
  updateSummary(sessionId: string, summary: string, keyFacts?: string[]): Promise<void>;
  updateMemory(sessionId: string, memory: Partial<ConversationMemory>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}

export class SupabaseConversationRepository implements ConversationRepository {
  private async assertAuthenticatedUser(userId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.auth.getUser();
    if (error) throw new Error(`Không thể xác thực tài khoản: ${error.message}`);
    if (!data.user) throw new Error('Phiên đăng nhập Supabase đã hết hạn. Vui lòng đăng nhập lại.');
    if (data.user.id !== userId) {
      throw new Error('Tài khoản đăng nhập không khớp với tài khoản đang lưu hội thoại.');
    }
  }

  async createSession(userId: string, topic: string, level: string | number, title?: string): Promise<ConversationSession> {
    if (!supabase) throw new Error('Supabase is not configured.');
    await this.assertAuthenticatedUser(userId);

    const now = new Date().toISOString();
    const cleanLevel = typeof level === 'number' ? level : parseInt(String(level).replace(/\D/g, ''), 10) || 1;
    const sessionTitle = title || `Trò chuyện về ${topic}`;

    const { data, error } = await supabase
      .from('conversation_sessions')
      .insert({
        user_id: userId,
        title: sessionTitle,
        topic,
        learner_level: cleanLevel,
        summary: '',
        key_facts: [],
        vocabulary: [],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(`Không thể tạo phiên hội thoại: ${formatSupabaseError(error)}`);

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      topic: data.topic,
      learnerLevel: data.learner_level,
      summary: data.summary || '',
      keyFacts: (data.key_facts as any) || [],
      vocabulary: (data.vocabulary as any) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getSession(sessionId: string): Promise<ConversationSession | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      topic: data.topic,
      learnerLevel: data.learner_level,
      summary: data.summary || '',
      keyFacts: (data.key_facts as any) || [],
      vocabulary: (data.vocabulary as any) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getUserSessions(userId: string): Promise<ConversationSession[]> {
    if (!supabase) return [];

    await this.assertAuthenticatedUser(userId);

    const { data, error } = await supabase
      .from('conversation_sessions')
      .select('*, conversation_messages(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Không thể tải lịch sử trò chuyện: ${formatSupabaseError(error)}`);
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      topic: item.topic,
      learnerLevel: item.learner_level,
      summary: item.summary || '',
      keyFacts: item.key_facts || [],
      vocabulary: item.vocabulary || [],
      messageCount: item.conversation_messages?.[0]?.count || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  async saveMessage(sessionId: string, userId: string, message: ConversationMessage): Promise<void> {
    if (!supabase) return;
    await this.assertAuthenticatedUser(userId);

    const { error } = await supabase.from('conversation_messages').insert({
      id: message.id,
      session_id: sessionId,
      user_id: userId,
      role: message.role,
      chinese: message.chinese,
      pinyin: message.pinyin || null,
      translation: message.translation || null,
      analysis: {
        corrections: message.corrections || [],
        vocabulary: message.vocabulary || [],
        grammarNote: message.grammarNote || null,
        encouragement: message.encouragement || null,
        followUpQuestion: message.followUpQuestion || null,
        scores: message.scores || null,
      },
      timestamp: message.timestamp || new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Không thể lưu tin nhắn vào tài khoản: ${formatSupabaseError(error)}`);
    }

    const { error: sessionError } = await supabase
      .from('conversation_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (sessionError) {
      throw new Error(`Không thể cập nhật thời gian hội thoại: ${formatSupabaseError(sessionError)}`);
    }

  }

  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error || !data) return [];

    return data.map((m) => ({
      id: m.id,
      sessionId: m.session_id,
      userId: m.user_id,
      role: m.role as any,
      chinese: m.chinese,
      pinyin: m.pinyin || undefined,
      translation: m.translation || undefined,
      timestamp: m.timestamp,
      corrections: m.analysis?.corrections || [],
      vocabulary: m.analysis?.vocabulary || [],
      grammarNote: m.analysis?.grammarNote || null,
      encouragement: m.analysis?.encouragement || undefined,
      followUpQuestion: m.analysis?.followUpQuestion || undefined,
      scores: m.analysis?.scores || undefined,
    }));
  }

  async updateSummary(sessionId: string, summary: string, keyFacts?: string[]): Promise<void> {
    if (!supabase) return;

    const updates: Record<string, any> = {
      summary,
      updated_at: new Date().toISOString(),
    };
    if (keyFacts) updates.key_facts = keyFacts;

    await supabase.from('conversation_sessions').update(updates).eq('id', sessionId);
  }

  async updateMemory(sessionId: string, memory: Partial<ConversationMemory>): Promise<void> {
    if (!supabase) return;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (memory.summary !== undefined) updates.summary = memory.summary;
    if (memory.keyFacts !== undefined) updates.key_facts = memory.keyFacts;
    if (memory.vocabulary !== undefined) updates.vocabulary = memory.vocabulary;

    await supabase.from('conversation_sessions').update(updates).eq('id', sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!supabase) return;

    // Messages cascade or delete manually
    await supabase.from('conversation_messages').delete().eq('session_id', sessionId);
    await supabase.from('conversation_sessions').delete().eq('id', sessionId);
  }
}

export class LocalStorageConversationRepository implements ConversationRepository {
  private SESSIONS_KEY = 'hanzi_ai_local_sessions_v2';
  private MESSAGES_PREFIX = 'hanzi_ai_local_messages_v2_';

  private getSessions(): ConversationSession[] {
    try {
      const raw = localStorage.getItem(this.SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveSessions(sessions: ConversationSession[]): void {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }

  async createSession(userId: string, topic: string, level: string | number, title?: string): Promise<ConversationSession> {
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const cleanLevel = typeof level === 'number' ? level : parseInt(String(level).replace(/\D/g, ''), 10) || 1;

    const newSession: ConversationSession = {
      id,
      userId,
      title: title || `Trò chuyện về ${topic}`,
      topic,
      learnerLevel: cleanLevel,
      summary: '',
      keyFacts: [],
      vocabulary: [],
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const existing = this.getSessions();
    this.saveSessions([newSession, ...existing]);
    return newSession;
  }

  async getSession(sessionId: string): Promise<ConversationSession | null> {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  async getUserSessions(userId: string): Promise<ConversationSession[]> {
    const sessions = this.getSessions();
    return sessions.filter((s) => s.userId === userId);
  }

  async saveMessage(sessionId: string, _userId: string, message: ConversationMessage): Promise<void> {
    try {
      const key = `${this.MESSAGES_PREFIX}${sessionId}`;
      const raw = localStorage.getItem(key);
      const list: ConversationMessage[] = raw ? JSON.parse(raw) : [];
      list.push(message);
      localStorage.setItem(key, JSON.stringify(list.slice(-50)));

      // update session message count & timestamp
      const sessions = this.getSessions();
      const sIndex = sessions.findIndex((s) => s.id === sessionId);
      if (sIndex >= 0) {
        sessions[sIndex].messageCount = list.length;
        sessions[sIndex].updatedAt = new Date().toISOString();
        this.saveSessions(sessions);
      }
    } catch {
      // ignore
    }
  }

  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
    try {
      const raw = localStorage.getItem(`${this.MESSAGES_PREFIX}${sessionId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async updateSummary(sessionId: string, summary: string, keyFacts?: string[]): Promise<void> {
    const sessions = this.getSessions();
    const s = sessions.find((item) => item.id === sessionId);
    if (s) {
      s.summary = summary;
      if (keyFacts) s.keyFacts = keyFacts;
      s.updatedAt = new Date().toISOString();
      this.saveSessions(sessions);
    }
  }

  async updateMemory(sessionId: string, memory: Partial<ConversationMemory>): Promise<void> {
    const sessions = this.getSessions();
    const s = sessions.find((item) => item.id === sessionId);
    if (s) {
      if (memory.summary !== undefined) s.summary = memory.summary;
      if (memory.keyFacts !== undefined) s.keyFacts = memory.keyFacts;
      if (memory.vocabulary !== undefined) s.vocabulary = memory.vocabulary;
      s.updatedAt = new Date().toISOString();
      this.saveSessions(sessions);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.saveSessions(sessions);
    localStorage.removeItem(`${this.MESSAGES_PREFIX}${sessionId}`);
  }
}
