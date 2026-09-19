// Gemini Request Builder for AI Speaking Practice
// Assembles system instructions, dynamic user context, memory layers, and user message into an optimized prompt.

import { buildLinaSystemPrompt } from './prompts/linaSystemPrompt';
import { ConversationMemory, formatMemoryForPrompt } from './memory/conversationMemory';
import { AI_CONFIG } from '../config/ai';

export interface BuildSpeakingRequestParams {
  userText: string;
  learnerProfile: {
    level: string;
    nativeLanguage: string;
    learningGoal?: string;
  };
  conversationMemory: ConversationMemory;
  settings?: {
    difficulty?: 'easy' | 'normal' | 'challenge';
    showPinyin?: boolean;
    showTranslation?: boolean;
  };
  topic?: string;
}

export interface BuiltSpeakingRequest {
  systemInstruction: string;
  promptContent: string;
  temperature: number;
  maxOutputTokens: number;
}

export function buildSpeakingRequest(params: BuildSpeakingRequestParams): BuiltSpeakingRequest {
  const {
    userText,
    learnerProfile,
    conversationMemory,
    settings,
    topic = conversationMemory.topic || 'Daily Life',
  } = params;

  // 1. Build Lina's core system prompt
  const systemInstruction = buildLinaSystemPrompt({
    learnerLevel: learnerProfile.level || conversationMemory.learnerLevel || 'HSK 1',
    nativeLanguage: learnerProfile.nativeLanguage || 'vi',
    topic,
    difficulty: settings?.difficulty || 'normal',
    learningGoal: learnerProfile.learningGoal || 'conversation',
    showPinyin: settings?.showPinyin !== false,
    showTranslation: settings?.showTranslation !== false,
  });

  // 2. Format memory context (summary + key facts + recent turns)
  const memoryContext = formatMemoryForPrompt(conversationMemory);

  // 3. Assemble dynamic context payload
  const promptParts: string[] = [
    `=== DYNAMIC CONVERSATION CONTEXT ===`,
    `TOPIC: ${topic}`,
    `TARGET LEVEL: ${learnerProfile.level || 'HSK 1'}`,
    `NATIVE LANGUAGE: ${learnerProfile.nativeLanguage || 'vi'}`,
    `DIFFICULTY: ${settings?.difficulty || 'normal'}`,
  ];

  if (memoryContext) {
    promptParts.push(`\n=== CONVERSATION MEMORY (FACTS & HISTORY) ===\n${memoryContext}`);
  }

  promptParts.push(
    `\n=== CURRENT USER UTTERANCE ===`,
    `Learner says: "${userText}"`,
    `\nRespond as Teacher Lina following your system principles and output strictly valid JSON.`
  );

  return {
    systemInstruction,
    promptContent: promptParts.join('\n'),
    temperature: AI_CONFIG.temperature,
    maxOutputTokens: AI_CONFIG.maxOutputTokens,
  };
}
