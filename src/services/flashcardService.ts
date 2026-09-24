import { supabase } from '../database/supabaseClient';

export interface Flashcard {
  id: string;
  user_id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example_sentence?: string;
  source_conversation_id?: string;
  topic?: string;
  hsk_level?: number;
  status: 'new' | 'learning' | 'learned';
  review_count: number;
  srs_repetitions: number;
  srs_correct_count: number;
  srs_incorrect_count: number;
  last_reviewed_at?: string;
  next_review_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Retrieves the current Supabase Bearer token for API requests
 */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch (err) {
    console.warn('Error fetching Supabase session:', err);
    return null;
  }
}

/**
 * Returns Authorization header with Bearer token if user is signed in
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

export const flashcardService = {
  /**
   * Fetches all flashcards belonging to the authenticated user.
   * If user is not signed in (Guest), returns empty list.
   */
  async getFlashcards(): Promise<Flashcard[]> {
    const token = await getAccessToken();
    if (!token) {
      // Guest user: return empty list, do not query protected backend
      return [];
    }

    const response = await fetch('/api/flashcards', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return [];
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch flashcards (${response.status})`);
    }

    const data = await response.json();
    return data.flashcards || [];
  },

  /**
   * Creates a new flashcard for the authenticated user.
   */
  async createFlashcard(card: {
    hanzi: string;
    pinyin: string;
    meaning: string;
    example_sentence?: string;
    topic?: string;
    hsk_level?: number;
  }): Promise<Flashcard> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required to save flashcards');
    }

    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create flashcard (${response.status})`);
    }

    const data = await response.json();
    return data.flashcard;
  },

  /**
   * Upserts multiple flashcards in a single request for the authenticated user.
   * If user is not authenticated, safely returns empty list without error.
   */
  async upsertBatchFlashcards(
    cards: Array<{
      hanzi: string;
      pinyin: string;
      meaning: string;
      example_sentence?: string;
      topic?: string;
      hsk_level?: number;
    }>
  ): Promise<Flashcard[]> {
    if (!cards || cards.length === 0) return [];
    const token = await getAccessToken();
    if (!token) {
      return [];
    }

    const response = await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cards }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to batch upsert flashcards (${response.status})`);
    }

    const data = await response.json();
    return data.flashcards || [];
  },

  /**
   * Updates status or progress of a flashcard owned by the authenticated user.
   */
  async updateFlashcard(
    id: string,
    updates: {
      status?: 'new' | 'learning' | 'learned';
      review_count?: number;
      srs_repetitions?: number;
      srs_correct_count?: number;
      srs_incorrect_count?: number;
      example_sentence?: string;
      last_reviewed_at?: string;
      next_review_at?: string;
    }
  ): Promise<Flashcard> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required to update flashcards');
    }

    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update flashcard (${response.status})`);
    }

    const data = await response.json();
    return data.flashcard;
  },

  /** Records an SRS review atomically; concurrent reviews cannot overwrite each other. */
  async reviewFlashcard(id: string, rating: 'correct' | 'incorrect'): Promise<Flashcard> {
    const token = await getAccessToken();
    if (!token) throw new Error('Authentication required to review flashcards');
    const response = await fetch(`/api/flashcards/${id}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating }),
    });
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error || `Failed to review flashcard (${response.status})`); }
    const data = await response.json();
    return data.flashcard;
  },

  /**
   * Deletes a flashcard owned by the authenticated user.
   */
  async deleteFlashcard(id: string): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required to delete flashcards');
    }

    const response = await fetch(`/api/flashcards/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Failed to delete flashcard (${response.status})`);
    }

    return true;
  },
};
