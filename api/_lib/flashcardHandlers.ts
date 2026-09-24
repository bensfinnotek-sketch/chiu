import { extractBearerToken, requireAuth, getAuthenticatedUser, getSupabaseServerClient } from "./authMiddleware.ts";
import { parseBody, sendJson } from "./httpUtils.ts";

export interface FlashcardItem {
  id: string;
  user_id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example_sentence?: string;
  source_conversation_id?: string;
  topic?: string;
  hsk_level?: number;
  status: "new" | "learning" | "learned";
  review_count: number;
  last_reviewed_at?: string;
  next_review_at?: string;
  created_at: string;
  updated_at: string;
  auto_saved?: boolean;
}

// In-memory isolated storage fallback for local dev / tests when Supabase env is not configured
// Keyed strictly by userId: Map<userId, Map<hanzi, FlashcardItem>>
const memoryStore = new Map<string, Map<string, FlashcardItem>>();

function getMemoryUserMap(userId: string): Map<string, FlashcardItem> {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, new Map());
  }
  return memoryStore.get(userId)!;
}

/**
 * Fetch flashcards for a specific authenticated user.
 * STRICT: Only queries by userId = authenticatedUser.id.
 */
export async function getFlashcardsForUser(userId: string, accessToken?: string | null): Promise<FlashcardItem[]> {
  const supabase = getSupabaseServerClient(accessToken);
  if (supabase) {
    const { data, error } = await supabase
      .from("user_vocabulary")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Flashcards] DB query error:", error);
      return [];
    }
    return data || [];
  }

  // Memory fallback
  const userMap = getMemoryUserMap(userId);
  return Array.from(userMap.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Upsert a flashcard for an authenticated user with UNIQUE(user_id, hanzi) logic.
 * If card already exists: preserves status, review_count, created_at, but updates updated_at and example_sentence.
 */
export async function upsertFlashcardForUser(
  userId: string,
  card: {
    hanzi: string;
    pinyin: string;
    meaning: string;
    example_sentence?: string;
    source_conversation_id?: string;
    topic?: string;
    hsk_level?: number;
    auto_saved?: boolean;
  },
  accessToken?: string | null,
  autoFlashcardDailyLimit?: number | null
): Promise<FlashcardItem | null> {
  const cleanHanzi = card.hanzi.trim();
  if (!cleanHanzi) return null;

  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient(accessToken);

  if (supabase && card.auto_saved === true && accessToken) {
    const { data, error } = await supabase.rpc("upsert_auto_flashcard", {
      p_user_id: userId,
      p_hanzi: cleanHanzi,
      p_pinyin: card.pinyin || "",
      p_meaning: card.meaning || "",
      p_example_sentence: card.example_sentence || null,
      p_topic: card.topic || "general",
      p_hsk_level: card.hsk_level || 1,
      p_daily_limit: autoFlashcardDailyLimit ?? null,
    });
    if (error) {
      console.error("[Flashcards] Atomic auto-save error:", error);
      return null;
    }
    return data || null;
  }

  if (supabase) {
    // Check if word already exists to preserve progress
    const { data: existing } = await supabase
      .from("user_vocabulary")
      .select("*")
      .eq("user_id", userId)
      .eq("hanzi", cleanHanzi)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("user_vocabulary")
        .update({
          pinyin: card.pinyin || existing.pinyin,
          meaning: card.meaning || existing.meaning,
          example_sentence: card.example_sentence || existing.example_sentence,
          topic: card.topic || existing.topic,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("[Flashcards] Upsert update error:", error);
        return existing;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from("user_vocabulary")
        .insert({
          user_id: userId,
          hanzi: cleanHanzi,
          pinyin: card.pinyin || "",
          meaning: card.meaning || "",
          example_sentence: card.example_sentence || "",
          source_conversation_id: card.source_conversation_id || null,
          topic: card.topic || "general",
          hsk_level: card.hsk_level || 1,
          auto_saved: card.auto_saved === true,
          status: "new",
          review_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error("[Flashcards] Upsert insert error:", error);
        return null;
      }
      return data;
    }
  }

  // Memory fallback
  const userMap = getMemoryUserMap(userId);
  const existing = userMap.get(cleanHanzi);

  if (existing) {
    existing.pinyin = card.pinyin || existing.pinyin;
    existing.meaning = card.meaning || existing.meaning;
    if (card.example_sentence) {
      existing.example_sentence = card.example_sentence;
    }
    existing.updated_at = now;
    return existing;
  }

  const newItem: FlashcardItem = {
    id: `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    hanzi: cleanHanzi,
    pinyin: card.pinyin || "",
    meaning: card.meaning || "",
    example_sentence: card.example_sentence || "",
    source_conversation_id: card.source_conversation_id,
    topic: card.topic || "general",
    hsk_level: card.hsk_level || 1,
    auto_saved: card.auto_saved === true,
    status: "new",
    review_count: 0,
    created_at: now,
    updated_at: now,
  };

  userMap.set(cleanHanzi, newItem);
  return newItem;
}

/**
 * Update flashcard status or review metadata.
 * STRICT: Checks both cardId AND userId.
 */
export async function updateFlashcardForUser(
  userId: string,
  cardId: string,
  updates: {
    status?: "new" | "learning" | "learned";
    review_count?: number;
    example_sentence?: string;
  },
  accessToken?: string | null
): Promise<FlashcardItem | null> {
  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient(accessToken);

  if (supabase) {
    const payload: any = { updated_at: now };
    if (updates.status) payload.status = updates.status;
    if (typeof updates.review_count === "number") payload.review_count = updates.review_count;
    if (updates.example_sentence) payload.example_sentence = updates.example_sentence;
    payload.last_reviewed_at = now;

    const { data, error } = await supabase
      .from("user_vocabulary")
      .update(payload)
      .eq("id", cardId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data;
  }

  // Memory fallback
  const userMap = getMemoryUserMap(userId);
  for (const item of userMap.values()) {
    if (item.id === cardId && item.user_id === userId) {
      if (updates.status) item.status = updates.status;
      if (typeof updates.review_count === "number") item.review_count = updates.review_count;
      if (updates.example_sentence) item.example_sentence = updates.example_sentence;
      item.last_reviewed_at = now;
      item.updated_at = now;
      return item;
    }
  }
  return null;
}

/**
 * Delete a flashcard for an authenticated user.
 * STRICT: Checks both cardId AND userId.
 */
export async function deleteFlashcardForUser(userId: string, cardId: string, accessToken?: string | null): Promise<boolean> {
  const supabase = getSupabaseServerClient(accessToken);

  if (supabase) {
    const { error, count } = await supabase
      .from("user_vocabulary")
      .delete()
      .eq("id", cardId)
      .eq("user_id", userId);

    if (error) return false;
    return (count ?? 1) > 0;
  }

  // Memory fallback
  const userMap = getMemoryUserMap(userId);
  for (const [hanzi, item] of userMap.entries()) {
    if (item.id === cardId && item.user_id === userId) {
      userMap.delete(hanzi);
      return true;
    }
  }
  return false;
}

// ==============================================================================
// HTTP HANDLERS (Used by Vercel Serverless & Express Router)
// ==============================================================================

/**
 * GET /api/flashcards
 * Lists authenticated user's flashcards.
 * Completely ignores any userId sent in query or body.
 */
export async function handleGetFlashcards(req: any, res: any) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return; // 401 already sent

  const cards = await getFlashcardsForUser(user.id, extractBearerToken(req));
  return sendJson(res, 200, {
    flashcards: cards,
    count: cards.length,
  });
}

/**
 * POST /api/flashcards
 * Creates a new flashcard for the authenticated user.
 * Ignores any userId passed by client and attaches user.id.
 */
export async function handleCreateFlashcard(req: any, res: any) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;

  const body = parseBody(req);
  const accessToken = extractBearerToken(req);

  // Support batch creation when `cards` array is provided
  if (Array.isArray(body?.cards)) {
    const rawCards = body.cards;
    const upsertedCards: FlashcardItem[] = [];

    for (const item of rawCards) {
      const hanzi = (item.hanzi || item.chinese || "").trim();
      if (!hanzi) continue;

      const card = await upsertFlashcardForUser(user.id, {
        hanzi,
        pinyin: (item.pinyin || "").trim(),
        meaning: (item.meaning || item.meaningVi || "").trim(),
        example_sentence: item.example_sentence || item.exampleSentence || item.exampleChinese || "",
        topic: item.topic || "lesson",
        hsk_level: item.hsk_level || item.hskLevel || 1,
      }, accessToken);

      if (card) {
        upsertedCards.push(card);
      }
    }

    return sendJson(res, 201, {
      flashcards: upsertedCards,
      count: upsertedCards.length,
      message: `Successfully processed ${upsertedCards.length} flashcards`,
    });
  }

  // Single card creation (original behavior preserved 100%)
  const { hanzi, pinyin, meaning, example_sentence, exampleSentence, topic, hskLevel, hsk_level } = body;

  if (!hanzi || typeof hanzi !== "string" || !hanzi.trim()) {
    return sendJson(res, 400, { error: "hanzi is required and must be a non-empty string" });
  }

  const card = await upsertFlashcardForUser(user.id, {
    hanzi: hanzi.trim(),
    pinyin: (pinyin || "").trim(),
    meaning: (meaning || "").trim(),
    example_sentence: example_sentence || exampleSentence || "",
    topic: topic || "general",
    hsk_level: hsk_level || hskLevel || 1,
  }, accessToken);

  return sendJson(res, 201, {
    flashcard: card,
    message: "Flashcard saved successfully",
  });
}

/**
 * PATCH /api/flashcards/:id (or /api/flashcards?id=...)
 * Updates a flashcard belonging to authenticated user.
 */
export async function handleUpdateFlashcard(req: any, res: any, cardId?: string) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;

  const id = cardId || req.query?.id || parseBody(req)?.id;
  if (!id) {
    return sendJson(res, 400, { error: "Flashcard id is required" });
  }

  const body = parseBody(req);
  const updated = await updateFlashcardForUser(user.id, id, {
    status: body.status,
    review_count: body.review_count,
    example_sentence: body.example_sentence || body.exampleSentence,
  }, extractBearerToken(req));

  if (!updated) {
    // 404: Not found or not owned by authenticated user (IDOR protection)
    return sendJson(res, 404, { error: "Flashcard not found or unauthorized" });
  }

  return sendJson(res, 200, {
    flashcard: updated,
    message: "Flashcard updated successfully",
  });
}

/**
 * DELETE /api/flashcards/:id (or /api/flashcards?id=...)
 * Deletes a flashcard belonging to authenticated user.
 */
export async function handleDeleteFlashcard(req: any, res: any, cardId?: string) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;

  const id = cardId || req.query?.id || parseBody(req)?.id;
  if (!id) {
    return sendJson(res, 400, { error: "Flashcard id is required" });
  }

  const success = await deleteFlashcardForUser(user.id, id, extractBearerToken(req));
  if (!success) {
    return sendJson(res, 404, { error: "Flashcard not found or unauthorized" });
  }

  return sendJson(res, 200, {
    success: true,
    message: "Flashcard deleted successfully",
  });
}

/**
 * GET /api/user/profile
 * Returns authenticated user profile.
 */
export async function handleGetUserProfile(req: any, res: any) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;

  const supabase = getSupabaseServerClient(extractBearerToken(req));
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      return sendJson(res, 200, { profile: data });
    }
  }

  return sendJson(res, 200, {
    profile: {
      id: user.id,
      email: user.email || "",
      display_name: user.email?.split("@")[0] || "Learner",
    },
  });
}
