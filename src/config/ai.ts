// Central AI Configuration for HanziAI
// Controls models, parameters, timeouts, and feature flags in one single location.

export interface AIConfig {
  provider: 'gemini' | 'mock';
  model: string;
  fallbackModel: string;
  temperature: number;
  maxOutputTokens: number;
  enableMemory: boolean;
  enableSpeakingAi: boolean;
  timeoutMs: number;
  maxRetries: number;
  maxRecentMessages: number;
  summarizeThreshold: number;
  isDevelopment: boolean;
}

const isDev = Boolean(import.meta.env.DEV);

export const AI_CONFIG: AIConfig = {
  provider: ((import.meta.env.VITE_AI_PROVIDER as string) || 'gemini') as 'gemini' | 'mock',
  model: (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-3.1-flash-lite',
  fallbackModel: 'gemini-3.8-flash',
  temperature: 0.7,
  maxOutputTokens: 1024,
  enableMemory: true,
  enableSpeakingAi: true,
  timeoutMs: 25000,
  maxRetries: 2,
  maxRecentMessages: 16,
  summarizeThreshold: 15,
  isDevelopment: isDev,
};

export const setAiProvider = (provider: 'gemini' | 'mock') => {
  AI_CONFIG.provider = provider;
};
