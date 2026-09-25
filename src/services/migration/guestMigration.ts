import { AuthUser } from '../../types/auth';
import { supabase, isSupabaseConfigured } from '../../database/supabaseClient';
import { LocalStorageConversationRepository } from '../repositories/conversationRepository';
import { LocalStorageProgressRepository } from '../repositories/progressRepository';
import { SupabaseConversationRepository } from '../repositories/conversationRepository';
import { SupabaseProgressRepository } from '../repositories/progressRepository';

const GUEST_MIGRATION_PREFIX = 'hanzi_ai_guest_migration_v1_';

function createMigratedMessageId(): string {
  return 'migrated_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
}

function getMigrationKey(userId: string, guestSessionId: string): string {
  return GUEST_MIGRATION_PREFIX + userId + '_' + guestSessionId;
}

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

    // 1. Migrate sessions. Each guest session gets one migration marker so
    // retries cannot create duplicate cloud sessions.
    const sessions = await localConv.getUserSessions('guest_user');
    for (const session of sessions) {
      const migrationKey = getMigrationKey(user.id, session.id);
      if (localStorage.getItem(migrationKey) === 'completed') continue;

      const messages = await localConv.getSessionMessages(session.id);
      const newSession = await cloudConv.createSession(
        user.id,
        session.topic,
        session.learnerLevel,
        session.title
      );

      // Guest message IDs are local identifiers and may already exist in a
      // different cloud session. Generate fresh IDs for migrated messages.
      for (const msg of messages) {
        await cloudConv.saveMessage(newSession.id, user.id, {
          ...msg,
          id: createMigratedMessageId(),
          sessionId: newSession.id,
          userId: user.id,
        });
      }

      if (session.summary || session.keyFacts) {
        await cloudConv.updateSummary(newSession.id, session.summary, session.keyFacts);
      }

      // Mark only after the whole session has migrated successfully.
      localStorage.setItem(migrationKey, 'completed');
    }

    // 2. Migrate progress only when actual guest progress data exists.
    const hasGuestProgress = localStorage.getItem('hanzi_ai_progress_guest_user') !== null;
    const guestProgress = await localProg.getProgress('guest_user');
    if (guestProgress && hasGuestProgress) {
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

    // Clean up local guest progress after successful migration.
    localStorage.removeItem('hanzi_ai_progress_guest_user');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}
