import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { LearningProgress } from '../types/progress';
import { ConversationSession } from '../types/conversation';
import {
  getProgressRepository,
  getConversationRepository,
  getVocabularyRepository,
} from '../services/repositories/repositoryFactory';

export interface DashboardData {
  progress: LearningProgress | null;
  recentSessions: ConversationSession[];
  vocabularyCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [recentSessions, setRecentSessions] = useState<ConversationSession[]>([]);
  const [vocabularyCount, setVocabularyCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const userId = user?.id || 'guest_user';

    try {
      const progRepo = getProgressRepository(user);
      const convRepo = getConversationRepository(user);
      const vocabRepo = getVocabularyRepository(user);

      const [p, sessions, vocab] = await Promise.all([
        progRepo.getProgress(userId),
        convRepo.getUserSessions(userId),
        vocabRepo.getUserVocabulary(userId),
      ]);

      setProgress(p);
      setRecentSessions(sessions.slice(0, 5));
      setVocabularyCount(vocab.length);
    } catch (err: any) {
      console.warn('Dashboard data fetch error:', err);
      setError('Không thể tải toàn bộ dữ liệu trang tổng quan.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    progress,
    recentSessions,
    vocabularyCount,
    isLoading,
    error,
    refresh: loadData,
  };
}
