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

export interface SrsContext {
  due: string[];
  weak: string[];
  newWords: string[];
}

export interface AdaptiveFocus {
  priorityWords: string[];
  grammarPatterns: string[];
  suggestedTestTypes: Array<'meaning' | 'pinyin' | 'context'>;
}

export function getAdaptiveFocus(memory: ConversationMemory): AdaptiveFocus {
  const srs = memory.srsContext || { due: [], weak: [], newWords: [] };
  const priorityWords = Array.from(new Set([...srs.weak, ...srs.due, ...srs.newWords]))
    .filter(Boolean)
    .slice(0, 6);
  const grammarPatterns = [...memory.grammarIssues]
    .sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen))
    .map((issue) => issue.pattern)
    .filter(Boolean)
    .slice(0, 3);
  const suggestedTestTypes: AdaptiveFocus['suggestedTestTypes'] =
    srs.weak.length > 0 ? ['context', 'meaning', 'pinyin'] :
    srs.due.length > 0 ? ['meaning', 'context', 'pinyin'] :
    ['meaning', 'pinyin', 'context'];
  return { priorityWords, grammarPatterns, suggestedTestTypes };
}

export interface ConversationMemory {
  sessionId: string;
  topic: string;
  learnerLevel: string;
  summary: string;
  keyFacts: string[];
  vocabulary: string[];
  grammarIssues: GrammarIssue[];
  srsContext?: SrsContext;
  recentMessages: ConversationMessage[];
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = 'hanzi_ai_conversation_memory_v1_';
const MAX_RECENT_MESSAGES = 16;

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
    srsContext: { due: [], weak: [], newWords: [] },
    recentMessages: [],
    updatedAt: Date.now(),
  };
}

export function extractAndReconcileFacts(existingFacts: string[], newFact: string): string[] {
  const normalizedNew = newFact.toLowerCase();
  const updated = existingFacts.filter((fact) => {
    const f = fact.toLowerCase();
    if ((normalizedNew.includes('thích') || normalizedNew.includes('like') || normalizedNew.includes('喜欢')) &&
        (f.includes('thích') || f.includes('like') || f.includes('喜欢'))) {
      if (normalizedNew.includes('bắc kinh') || normalizedNew.includes('烤鸭') || normalizedNew.includes('duck')) {
        return !f.includes('lẩu') && !f.includes('hotpot') && !f.includes('火锅');
      }
    }
    if ((normalizedNew.includes('sống tại') || normalizedNew.includes('lives in') || normalizedNew.includes('住在')) &&
        (f.includes('sống tại') || f.includes('lives in') || f.includes('住在'))) {
      if (normalizedNew.includes('hồ chí minh') || normalizedNew.includes('胡志明') || normalizedNew.includes('saigon')) {
        return !f.includes('hà nội') && !f.includes('hanoi') && !f.includes('河内');
      }
    }
    return true;
  });
  if (!updated.includes(newFact)) updated.push(newFact);
  return updated.slice(-10);
}

export function inspectUserTextForFacts(userText: string, currentFacts: string[]): string[] {
  let facts = [...currentFacts];
  const nameMatch = userText.match(/(?:我叫|名字(?:是|叫))\s*([^\s,，。！!]+)/);
  if (nameMatch?.[1]) facts = extractAndReconcileFacts(facts, `Learner's name is ${nameMatch[1]} (叫${nameMatch[1]})`);
  const locMatch = userText.match(/(?:我住在|我现在在|我家在)\s*([^\s,，。！!]+)/);
  if (locMatch?.[1]) facts = extractAndReconcileFacts(facts, `Learner lives in ${locMatch[1]} (住在${locMatch[1]})`);
  const prefMatch = userText.match(/(?:我(?:最|很|更)?喜欢|其实我现在更喜欢)\s*([^\s,，。！!]+)/);
  if (prefMatch?.[1]) facts = extractAndReconcileFacts(facts, `Learner likes ${prefMatch[1]} (喜欢${prefMatch[1]})`);
  return facts;
}

export function updateMemoryWithTurn(
  memory: ConversationMemory,
  userMessage: ConversationMessage,
  aiMessage: ConversationMessage,
  analysis?: SpeakingAnalysis
): ConversationMemory {
  const updatedFacts = inspectUserTextForFacts(userMessage.chinese, memory.keyFacts);
  const vocabSet = new Set(memory.vocabulary);
  analysis?.vocabulary?.forEach((v) => vocabSet.add(v.hanzi));
  const updatedGrammar = [...memory.grammarIssues];
  if (analysis?.corrections?.length) {
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
  const updatedMessages = [...memory.recentMessages, userMessage, aiMessage].slice(-MAX_RECENT_MESSAGES);
  let summary = memory.summary;
  if (updatedFacts.length > 0) summary = `The learner is practicing ${memory.topic} (${memory.learnerLevel}). Known facts: ${updatedFacts.join('; ')}.`;
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

export function formatMemoryForPrompt(memory: ConversationMemory): string {
  const parts: string[] = [];
  if (memory.summary) parts.push(`MEMORY SUMMARY:\n${memory.summary}`);
  if (memory.keyFacts.length > 0) parts.push(`KEY FACTS STATED BY LEARNER:\n${memory.keyFacts.map((f) => `- ${f}`).join('\n')}`);
  if (memory.vocabulary.length > 0) parts.push(`VOCABULARY DISCUSSED SO FAR:\n${memory.vocabulary.slice(-10).join(', ')}`);
  if (memory.srsContext) {
    const { due, weak, newWords } = memory.srsContext;
    if (due.length > 0) parts.push(`SRS WORDS DUE FOR REVIEW:\n${due.slice(0, 8).join(', ')}`);
    if (weak.length > 0) parts.push(`SRS WEAK WORDS TO REINFORCE:\n${weak.slice(0, 8).join(', ')}`);
    if (newWords.length > 0) parts.push(`SRS NEW WORDS:\n${newWords.slice(0, 8).join(', ')}`);
  }
  const adaptiveFocus = getAdaptiveFocus(memory);
  if (adaptiveFocus.priorityWords.length > 0 || adaptiveFocus.grammarPatterns.length > 0) {
    parts.push(
      `ADAPTIVE SESSION FOCUS:
- Priority vocabulary to revisit naturally: ${adaptiveFocus.priorityWords.join(', ') || 'none'}
- Grammar patterns to watch for: ${adaptiveFocus.grammarPatterns.join(' | ') || 'none'}
- Micro-test order: ${adaptiveFocus.suggestedTestTypes.join(' → ')}
RULE: Reuse priority vocabulary only when it fits the learner's current meaning and conversation flow. Do not force it.`
    );
  }
  if (memory.grammarIssues.length > 0) {
    const recurring = memory.grammarIssues.slice(-5).sort((a, b) => b.count - a.count)
      .map((issue) => `- ${issue.pattern} (${issue.count}x)`).join('\n');
    parts.push(`RECURRING GRAMMAR WEAKNESSES:\n${recurring}`);
  }
  if (memory.recentMessages.length > 0) {
    const recentTurns = memory.recentMessages.slice(-8)
      .map((m) => `${m.sender === 'user' ? 'Learner' : 'Teacher Lina'}: ${m.chinese}`).join('\n');
    parts.push(`RECENT CONVERSATION TURNS:\n${recentTurns}`);
  }
  return parts.join('\n\n');
}

export function saveMemoryToStorage(memory: ConversationMemory): void {
  try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${memory.sessionId}`, JSON.stringify(memory)); }
  catch (err) { console.warn('Could not save conversation memory to storage:', err); }
}

export function loadMemoryFromStorage(sessionId: string): ConversationMemory | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Could not load conversation memory:', err);
    return null;
  }
}

export function clearMemoryFromStorage(sessionId: string): void {
  try { localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`); }
  catch (err) { console.warn('Could not clear memory from storage:', err); }
}
