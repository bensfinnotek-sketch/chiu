import type { ConversationMessage, TutorResponse, TutorMode, TutorHint } from './types';

export interface AiTutorService {
  respond(input: {
    userText: string;
    targetLevel?: string;
    topic?: string;
    mode?: TutorMode;
    conversationHistory?: ConversationMessage[];
    memory?: { summary?: string; keyFacts?: string[]; vocabulary?: string[]; grammarIssues?: string[] };
    difficulty?: 'easy' | 'normal' | 'challenge';
    signal?: AbortSignal;
  }): Promise<TutorResponse>;
  hint(input: { prompt: string; targetLevel?: string; level: 1 | 2 | 3 | 4; signal?: AbortSignal }): Promise<TutorHint>;
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `AI server error (${response.status})`);
  return data as T;
}

export const aiTutorService: AiTutorService = {
  respond: (input) => postJson<TutorResponse>('/api/ai/speaking', {
    userText: input.userText,
    targetLevel: input.targetLevel || 'HSK 1',
    topic: input.topic || 'Daily Life',
    mode: input.mode || 'conversation',
    conversationHistory: (input.conversationHistory || []).slice(-12),
    nativeLanguage: 'vi',
    difficulty: input.difficulty || 'normal',
    memory: input.memory,
  }, input.signal),

  hint: (input) => postJson<TutorHint>('/api/ai/hint', {
    prompt: input.prompt,
    targetLevel: input.targetLevel || 'HSK 1',
    level: input.level,
  }, input.signal),
};

export const speechToTextService: SpeechToTextService = {
  async start() { throw new Error('Speech-to-Text sẽ được kết nối ở phase voice.'); },
  stop() {}
};
export const textToSpeechService: TextToSpeechService = {
  async speak() { throw new Error('Text-to-Speech sẽ được kết nối ở phase voice.'); },
  stop() {}
};
export const avatarService: AvatarService = {
  setState() {}
};

export interface SpeechToTextService { start(onText: (text: string) => void): Promise<void>; stop(): void; }
export interface TextToSpeechService { speak(text: string): Promise<void>; stop(): void; }
export interface AvatarService { setState(state: 'idle'|'listening'|'thinking'|'speaking'): void; }
