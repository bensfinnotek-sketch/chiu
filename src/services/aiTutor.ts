import { geminiService } from './geminiService';
import type { SpeakingAnalysis, TutorMode } from '../ai/schemas/speakingSchema';

export interface TutorTurnInput {
  userText: string;
  targetLevel?: string;
  topic?: string;
  mode?: TutorMode;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; chinese: string; translation?: string }>;
  memory?: unknown;
  difficulty?: 'easy' | 'normal' | 'challenge';
  signal?: AbortSignal;
}

export interface TutorHint {
  level: 1 | 2 | 3 | 4;
  hint: string;
}

export interface AITutor {
  respond(input: TutorTurnInput): Promise<SpeakingAnalysis>;
  hint(context: { targetLevel?: string; prompt: string; level: 1 | 2 | 3 | 4 }): Promise<TutorHint>;
}

export const aiTutor: AITutor = {
  respond: (input) => geminiService.analyzeSpeaking(input),
  async hint(context) {
    const response = await fetch('/api/ai/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal: undefined,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Không thể tạo gợi ý.');
    return response.json();
  },
};
