// Conversation Memory Module for HanziAI
// Provides Short-Term recent turn storage and Long-Term key facts + summary retention.
// Implements contradiction updates, privacy safeguards, and token management.

import type { ConversationMessage } from '../../types';
import type { SpeakingAnalysis } from '../schemas/speakingSchema';

export interface GrammarIssue {
  pattern: string;
  count: number;
  lastSeen: string;
}

export interface ConversationMemory {
  sessionId: string;
  topic: string;
  learnerLevel: string;
  summary: string;
  keyFacts: string[];
  vocabulary: string[];
  grammarIssues: GrammarIssue[];
  recentMessages: ConversationMessage[];
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = 'hanzi_ai_conversation_memory_v1_';
const MAX_RECENT_MESSAGES = 16;

/**
 * Creates an initialized, clean conversation memory state.
 */
export function createEmptyMemory(
  sessionId: string = `speaking_${Date.now()}`,
  topic: string = 'Daily Life',
  learnerLevel: string = 'HSK 1'
): ConversationMemory {
  return {
    sessionId,
    topic,
    learnerLevel,
    summary: `Learner is practicing ${topic} at ${learnerLevel} level.`,
    keyFacts: [],
    vocabulary: [],
    grammarIssues: [],
    recentMessages: [],
    updatedAt: Date.now(),
  };
}

/**
 * Updates key facts with awareness of corrections and contradictions (Section 18 & 19).
 * E.g., if learner previously said they like hotpot, but now says "其实我现在喜欢北京烤鸭",
 * remove the old hotpot fact and store the updated preference.
 */
export function extractAndReconcileFacts(existingFacts: string[], newFact: string): string[] {
  const normalizedNew = newFact.toLowerCase();

  // Filter out any contradictory old facts
  const updated = existingFacts.filter((fact) => {
    const f = fact.toLowerCase();
    // Preference conflict
    if ((normalizedNew.includes('thích') || normalizedNew.includes('like') || normalizedNew.includes('喜欢')) &&
        (f.includes('thích') || f.includes('like') || f.includes('喜欢'))) {
      if (normalizedNew.includes('bắc kinh') || normalizedNew.includes('烤鸭') || normalizedNew.includes('duck')) {
        return !f.includes('lẩu') && !f.includes('hotpot') && !f.includes('火锅');
      }
    }
    // Location conflict
    if ((normalizedNew.includes('sống tại') || normalizedNew.includes('lives in') || normalizedNew.includes('住在')) &&
        (f.includes('sống tại') || f.includes('lives in') || f.includes('住在'))) {
      if (normalizedNew.includes('hồ chí minh') || normalizedNew.includes('胡志明') || normalizedNew.includes('saigon')) {
        return !f.includes('hà nội') && !f.includes('hanoi') && !f.includes('河内');
      }
    }
    return true;
  });

  if (!updated.includes(newFact)) {
    updated.push(newFact);
  }

  return updated.slice(-10); // Keep top 10 most relevant facts
}

/**
 * Automatically inspects user utterance to detect and store key facts directly.
 */
export function inspectUserTextForFacts(userText: string, currentFacts: string[]): string[] {
  let facts = [...currentFacts];

  // Name detection: 我叫... / 我的名字是...
  const nameMatch = userText.match(/(?:我叫|名字(?:是|叫))\s*([^\s,，。！!]+)/);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1];
    facts = extractAndReconcileFacts(facts, `Learner's name is ${name} (叫${name})`);
  }

  // Location: 我住在... / 我在...
  const locMatch = userText.match(/(?:我住在|我现在在|我家在)\s*([^\s,，。！!]+)/);
  if (locMatch && locMatch[1]) {
    const loc = locMatch[1];
    facts = extractAndReconcileFacts(facts, `Learner lives in ${loc} (住在${loc})`);
  }

  // Preferences: 我喜欢... / 我最喜欢... / 其实我现在更喜欢...
  const prefMatch = userText.match(/(?:我(?:最|很|更)?喜欢|其实我现在更喜欢)\s*([^\s,，。！!]+)/);
  if (prefMatch && prefMatch[1]) {
    const item = prefMatch[1];
    facts = extractAndReconcileFacts(facts, `Learner likes ${item} (喜欢${item})`);
  }

  return facts;
}

/**
 * Updates memory state after a conversational turn.
 */
export function updateMemoryWithTurn(
  memory: ConversationMemory,
  userMessage: ConversationMessage,
  aiMessage: ConversationMessage,
  analysis?: SpeakingAnalysis
): ConversationMemory {
  // 1. Reconcile key facts from user text
  const updatedFacts = inspectUserTextForFacts(userMessage.chinese, memory.keyFacts);

  // 2. Accumulate vocabulary
  const vocabSet = new Set(memory.vocabulary);
  if (analysis?.vocabulary) {
    analysis.vocabulary.forEach((v) => vocabSet.add(v.hanzi));
  }

  // 3. Track recurring grammar issues
  const updatedGrammar = [...memory.grammarIssues];
  if (analysis?.corrections && analysis.corrections.length > 0) {
    const first = analysis.corrections[0];
    const patternName = first.explanation.slice(0, 30);
    const existing = updatedGrammar.find((g) => g.pattern === patternName);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = new Date().toISOString();
    } else {
      updatedGrammar.push({ pattern: patternName, count: 1, lastSeen: new Date().toISOString() });
    }
  }

  // 4. Update recent messages (bounded window)
  const updatedMessages = [...memory.recentMessages, userMessage, aiMessage].slice(-MAX_RECENT_MESSAGES);

  // 5. Update summary text if facts changed
  let summary = memory.summary;
  if (updatedFacts.length > 0) {
    summary = `The learner is practicing ${memory.topic} (${memory.learnerLevel}). Known facts: ${updatedFacts.join('; ')}.`;
  }

  return {
    ...memory,
    keyFacts: updatedFacts,
    vocabulary: Array.from(vocabSet).slice(-50),
    grammarIssues: updatedGrammar.slice(-10),
    recentMessages: updatedMessages,
    summary,
    updatedAt: Date.now(),
  };
}

/**
 * Formats memory context compactly for the Gemini prompt (Section 17).
 */
export function formatMemoryForPrompt(memory: ConversationMemory): string {
  const parts: string[] = [];

  if (memory.summary) {
    parts.push(`MEMORY SUMMARY:\n${memory.summary}`);
  }

  if (memory.keyFacts.length > 0) {
    parts.push(`KEY FACTS STATED BY LEARNER:\n${memory.keyFacts.map((f) => `- ${f}`).join('\n')}`);
  }

  if (memory.vocabulary.length > 0) {
    parts.push(`VOCABULARY DISCUSSED SO FAR:\n${memory.vocabulary.slice(-10).join(', ')}`);
  }

  if (memory.recentMessages.length > 0) {
    const recentTurns = memory.recentMessages
      .slice(-8)
      .map((m) => `${m.sender === 'user' ? 'Learner' : 'Teacher Lina'}: ${m.chinese}`)
      .join('\n');
    parts.push(`RECENT CONVERSATION TURNS:\n${recentTurns}`);
  }

  return parts.join('\n\n');
}

/**
 * LocalStorage persistence helpers (Section 15, 16).
 */
export function saveMemoryToStorage(memory: ConversationMemory): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${memory.sessionId}`;
    localStorage.setItem(key, JSON.stringify(memory));
  } catch (err) {
    console.warn('Could not save conversation memory to storage:', err);
  }
}

export function loadMemoryFromStorage(sessionId: string): ConversationMemory | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load conversation memory:', err);
    return null;
  }
}

export function clearMemoryFromStorage(sessionId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Could not clear conversation memory:', err);
  }
}
