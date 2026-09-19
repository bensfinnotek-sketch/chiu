export interface ConversationMessage {
  id: string;
  sessionId: string;
  userId?: string;
  role: 'user' | 'assistant';
  chinese: string;
  pinyin?: string;
  translation?: string;
  timestamp: string;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  vocabulary?: Array<{
    hanzi: string;
    pinyin: string;
    meaning: string;
    hsk?: string;
  }>;
  grammarNote?: string | null;
  encouragement?: string;
  followUpQuestion?: string;
  scores?: {
    clarity: number;
    grammar: number;
    vocabulary: number;
    naturalness: number;
  };
}

export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  topic: string;
  learnerLevel: number | string;
  summary: string;
  keyFacts: string[];
  vocabulary: string[];
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMemory {
  sessionId: string;
  topic: string;
  learnerLevel: number | string;
  summary: string;
  keyFacts: string[];
  vocabulary: string[];
  recentMessages: ConversationMessage[];
  updatedAt?: number;
}
