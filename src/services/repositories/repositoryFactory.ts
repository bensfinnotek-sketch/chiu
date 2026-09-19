import { AuthUser } from '../../types/auth';
import { isSupabaseConfigured } from '../../database/supabaseClient';

import {
  UserRepository,
  SupabaseUserRepository,
  LocalStorageUserRepository,
} from './userRepository';

import {
  ConversationRepository,
  SupabaseConversationRepository,
  LocalStorageConversationRepository,
} from './conversationRepository';

import {
  ProgressRepository,
  SupabaseProgressRepository,
  LocalStorageProgressRepository,
} from './progressRepository';

import {
  VocabularyRepository,
  SupabaseVocabularyRepository,
  LocalStorageVocabularyRepository,
} from './vocabularyRepository';

// Singletons for performance
const supabaseUserRepo = new SupabaseUserRepository();
const localUserRepo = new LocalStorageUserRepository();

const supabaseConversationRepo = new SupabaseConversationRepository();
const localConversationRepo = new LocalStorageConversationRepository();

const supabaseProgressRepo = new SupabaseProgressRepository();
const localProgressRepo = new LocalStorageProgressRepository();

const supabaseVocabularyRepo = new SupabaseVocabularyRepository();
const localVocabularyRepo = new LocalStorageVocabularyRepository();

export function getUserRepository(user: AuthUser | null): UserRepository {
  if (user && isSupabaseConfigured) {
    return supabaseUserRepo;
  }
  return localUserRepo;
}

export function getConversationRepository(user: AuthUser | null): ConversationRepository {
  if (user && isSupabaseConfigured) {
    return supabaseConversationRepo;
  }
  return localConversationRepo;
}

export function getProgressRepository(user: AuthUser | null): ProgressRepository {
  if (user && isSupabaseConfigured) {
    return supabaseProgressRepo;
  }
  return localProgressRepo;
}

export function getVocabularyRepository(user: AuthUser | null): VocabularyRepository {
  if (user && isSupabaseConfigured) {
    return supabaseVocabularyRepo;
  }
  return localVocabularyRepo;
}
