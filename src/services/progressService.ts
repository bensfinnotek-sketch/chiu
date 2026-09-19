// Speaking Progress & Settings Persistence Service for HanziAI

export interface SpeakingSettings {
  voice: string;
  speed: number; // 0.8, 1.0, 1.2
  difficulty: 'easy' | 'normal' | 'challenge';
  showPinyin: boolean;
  showTranslation: boolean;
  autoPlayAi: boolean;
  autoListen: boolean;
}

export interface SessionRecord {
  id: string;
  topic: string;
  level: string;
  timestamp: string;
  durationMinutes: number;
  turns: number;
  wordsLearned: string[];
  correctionsCount: number;
  averageScores?: {
    clarity: number;
    grammar: number;
    vocabulary: number;
    naturalness: number;
  };
}

export interface SpeakingProgress {
  speaking_minutes: number;
  conversation_count: number;
  vocabulary_learned: string[];
  corrections_count: number;
  topics: string[];
  last_practice: string;
  streak: number;
  session_history: SessionRecord[];
}

const SETTINGS_KEY = 'hanzi_ai_speaking_settings';
const HISTORY_KEY = 'hanzi_ai_conversation_history';
const PROGRESS_KEY = 'hanzi_ai_progress';

const DEFAULT_SETTINGS: SpeakingSettings = {
  voice: 'Lina',
  speed: 0.9,
  difficulty: 'normal',
  showPinyin: true,
  showTranslation: true,
  autoPlayAi: true,
  autoListen: false,
};

const DEFAULT_PROGRESS: SpeakingProgress = {
  speaking_minutes: 42,
  conversation_count: 7,
  vocabulary_learned: ['咖啡', '喜欢', '工作', '周末', '朋友', '买单', '多少钱'],
  corrections_count: 5,
  topics: ['Daily Life', 'Food', 'Travel'],
  last_practice: new Date().toISOString(),
  streak: 3,
  session_history: [],
};

class ProgressService {
  // --- Settings ---
  public getSettings(): SpeakingSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<SpeakingSettings>): SpeakingSettings {
    const updated = { ...this.getSettings(), ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  }

  // --- Progress Tracking ---
  public getProgress(): SpeakingProgress {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      if (stored) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PROGRESS;
  }

  public recordSession(session: Omit<SessionRecord, 'id' | 'timestamp'>): void {
    const progress = this.getProgress();
    const newRecord: SessionRecord = {
      ...session,
      id: 'sess_' + Date.now(),
      timestamp: new Date().toISOString(),
    };

    const newMinutes = progress.speaking_minutes + Math.max(1, Math.round(session.durationMinutes));
    const newConversations = progress.conversation_count + 1;
    const combinedWords = Array.from(new Set([...progress.vocabulary_learned, ...session.wordsLearned]));
    const newTopics = Array.from(new Set([...progress.topics, session.topic]));
    const newCorrections = progress.corrections_count + session.correctionsCount;

    // Calculate streak
    const lastDate = progress.last_practice ? new Date(progress.last_practice).toDateString() : null;
    const today = new Date().toDateString();
    let newStreak = progress.streak;
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastDate === yesterday) {
        newStreak += 1;
      } else if (!lastDate) {
        newStreak = 1;
      }
    }

    const updatedProgress: SpeakingProgress = {
      speaking_minutes: newMinutes,
      conversation_count: newConversations,
      vocabulary_learned: combinedWords,
      corrections_count: newCorrections,
      topics: newTopics,
      last_practice: new Date().toISOString(),
      streak: newStreak,
      session_history: [newRecord, ...(progress.session_history || [])].slice(0, 50),
    };

    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(updatedProgress));
    } catch {
      // ignore
    }
  }

  // --- Conversation History (Raw turns) ---
  public getConversationHistory(topicId?: string): any[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const all = JSON.parse(stored);
        if (topicId) {
          return all.filter((item: any) => item.topic === topicId);
        }
        return all;
      }
    } catch {
      // ignore
    }
    return [];
  }

  public saveConversationTurn(entry: any): void {
    try {
      const existing = this.getConversationHistory();
      const updated = [...existing, entry].slice(-100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public clearConversationHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }
}

export const progressService = new ProgressService();
