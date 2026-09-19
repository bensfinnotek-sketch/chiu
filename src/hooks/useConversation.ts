import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ConversationSession, ConversationMessage } from '../types/conversation';
import { getConversationRepository, getProgressRepository } from '../services/repositories/repositoryFactory';
import { geminiSpeakingService } from '../services/geminiSpeakingService';
import {
  ConversationMemory as AiMemory,
  updateMemoryWithTurn,
  createEmptyMemory,
} from '../ai/memory/conversationMemory';

export function useConversation() {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [memory, setMemory] = useState<AiMemory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

  const repo = getConversationRepository(user);
  const progressRepo = getProgressRepository(user);
  const userId = user?.id || 'guest_user';

  // Start new session
  const startConversation = useCallback(
    async (topic: string, level: string | number, title?: string): Promise<ConversationSession> => {
      setIsLoading(true);
      try {
        const session = await repo.createSession(userId, topic, level, title);
        setCurrentSession(session);
        setMessages([]);
        const initialMemory = createEmptyMemory(session.id, session.topic, `HSK ${session.learnerLevel}`);
        setMemory(initialMemory);
        return session;
      } finally {
        setIsLoading(false);
      }
    },
    [repo, userId]
  );

  // Resume existing session
  const resumeConversation = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const session = await repo.getSession(sessionId);
        if (!session) return false;

        const msgs = await repo.getSessionMessages(sessionId);
        setCurrentSession(session);
        setMessages(msgs);

        const mem = createEmptyMemory(session.id, session.topic, `HSK ${session.learnerLevel}`);
        mem.summary = session.summary || '';
        mem.keyFacts = session.keyFacts || [];
        mem.vocabulary = session.vocabulary || [];
        mem.recentMessages = msgs.slice(-16).map((m) => ({
          id: m.id,
          sender: m.role === 'user' ? 'user' : 'lina',
          chinese: m.chinese,
          pinyin: m.pinyin,
          translation: m.translation,
          timestamp: m.timestamp,
        }));

        setMemory(mem);
        return true;
      } catch (e) {
        console.warn('Error resuming session:', e);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [repo]
  );

  // Send message and process AI turn
  const sendMessage = useCallback(
    async (text: string, options?: { nativeLanguage?: string; difficulty?: string }) => {
      if (!currentSession || !text.trim()) return null;

      const userMsgId = `msg_${Date.now()}_u`;
      const userMessage: ConversationMessage = {
        id: userMsgId,
        sessionId: currentSession.id,
        userId,
        role: 'user',
        chinese: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      await repo.saveMessage(currentSession.id, userId, userMessage);

      setIsAiResponding(true);

      try {
        // Format history window (max 16 recent messages)
        const recentHistory = updatedMessages.slice(-16).map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          chinese: m.chinese,
          pinyin: m.pinyin,
          translation: m.translation,
        }));

        // Send to Gemini Speaking API
        const analysis = await geminiSpeakingService.analyzeSpeaking({
          userText: text.trim(),
          topic: currentSession.topic,
          targetLevel: `HSK ${currentSession.learnerLevel}`,
          conversationHistory: recentHistory,
          nativeLanguage: options?.nativeLanguage || 'vi',
          difficulty: options?.difficulty || 'normal',
          memory: memory || undefined,
        } as any);

        const aiMsgId = `msg_${Date.now()}_a`;
        const aiMessage: ConversationMessage = {
          id: aiMsgId,
          sessionId: currentSession.id,
          userId,
          role: 'assistant',
          chinese: analysis.reply,
          pinyin: analysis.pinyin,
          translation: analysis.translation,
          timestamp: new Date().toISOString(),
          corrections: analysis.corrections,
          vocabulary: analysis.vocabulary,
          grammarNote: analysis.grammarNote || undefined,
          encouragement: analysis.encouragement || undefined,
          followUpQuestion: undefined,
          scores: {
            clarity: analysis.clarityScore || 5,
            grammar: analysis.grammarScore || 5,
            vocabulary: analysis.vocabularyScore || 5,
            naturalness: analysis.naturalnessScore || 5,
          },
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await repo.saveMessage(currentSession.id, userId, aiMessage);

        // Update conversation memory
        const currentMemoryState =
          memory || createEmptyMemory(currentSession.id, currentSession.topic, `HSK ${currentSession.learnerLevel}`);

        const updatedMem = updateMemoryWithTurn(
          currentMemoryState,
          {
            id: userMessage.id,
            sender: 'user',
            chinese: userMessage.chinese,
            timestamp: userMessage.timestamp,
          },
          {
            id: aiMessage.id,
            sender: 'lina',
            chinese: aiMessage.chinese,
            pinyin: aiMessage.pinyin,
            translation: aiMessage.translation,
            timestamp: aiMessage.timestamp,
          },
          analysis as any
        );

        setMemory(updatedMem);
        await repo.updateMemory(currentSession.id, {
          summary: updatedMem.summary,
          keyFacts: updatedMem.keyFacts,
          vocabulary: updatedMem.vocabulary,
        });

        // Record speaking activity progress
        progressRepo.recordStudyActivity(userId, {
          type: 'speaking',
          durationMinutes: 1,
          wordsLearnedDelta: analysis.vocabulary?.length || 0,
        });

        return { userMessage, aiMessage, analysis };
      } catch (err) {
        console.error('Error during AI turn:', err);
        return null;
      } finally {
        setIsAiResponding(false);
      }
    },
    [currentSession, messages, memory, repo, progressRepo, userId]
  );

  const deleteConversation = useCallback(
    async (sessionId: string) => {
      await repo.deleteSession(sessionId);
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
        setMemory(null);
      }
    },
    [repo, currentSession]
  );

  return {
    currentSession,
    messages,
    memory,
    isLoading,
    isAiResponding,
    startConversation,
    resumeConversation,
    sendMessage,
    deleteConversation,
    setMessages,
  };
}
