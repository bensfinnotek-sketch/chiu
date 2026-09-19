import { AuthUser } from '../../types/auth';
import { supabase, isSupabaseConfigured } from '../../database/supabaseClient';
import { LocalStorageConversationRepository } from '../repositories/conversationRepository';
import { LocalStorageProgressRepository } from '../repositories/progressRepository';
import { SupabaseConversationRepository } from '../repositories/conversationRepository';
import { SupabaseProgressRepository } from '../repositories/progressRepository';

export async function checkHasGuestData(): Promise<boolean> {
  const localConv = new LocalStorageConversationRepository();
  const sessions = await localConv.getUserSessions('guest_user');
  const rawProgress = localStorage.getItem('hanzi_ai_progress_guest_user');
  return sessions.length > 0 || Boolean(rawProgress);
}

export async function migrateGuestDataToUser(user: AuthUser): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const localConv = new LocalStorageConversationRepository();
    const cloudConv = new SupabaseConversationRepository();
    const localProg = new LocalStorageProgressRepository();
    const cloudProg = new SupabaseProgressRepository();

    // 1. Migrate sessions
    const sessions = await localConv.getUserSessions('guest_user');
    for (const session of sessions) {
      const messages = await localConv.getSessionMessages(session.id);
      const newSession = await cloudConv.createSession(
        user.id,
        session.topic,
        session.learnerLevel,
        session.title
      );

      for (const msg of messages) {
        await cloudConv.saveMessage(newSession.id, user.id, {
          ...msg,
          sessionId: newSession.id,
          userId: user.id,
        });
      }

      if (session.summary || session.keyFacts) {
        await cloudConv.updateSummary(newSession.id, session.summary, session.keyFacts);
      }
    }

    // 2. Migrate progress
    const guestProgress = await localProg.getProgress('guest_user');
    if (guestProgress) {
      await cloudProg.updateProgress(user.id, {
        totalStudyMinutes: guestProgress.totalStudyMinutes,
        lessonsCompleted: guestProgress.lessonsCompleted,
        wordsLearned: guestProgress.wordsLearned,
        speakingMinutes: guestProgress.speakingMinutes,
        conversationsCompleted: guestProgress.conversationsCompleted,
        currentStreak: guestProgress.currentStreak,
        longestStreak: guestProgress.longestStreak,
        lastStudyDate: guestProgress.lastStudyDate,
      });
    }

    // Clean up local guest data
    localStorage.removeItem('hanzi_ai_progress_guest_user');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}
