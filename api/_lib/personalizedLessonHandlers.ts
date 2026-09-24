import { getAI, generateContentSafely } from "./geminiHandlers.ts";
import { requireAuth, getSupabaseServerClient } from "./authMiddleware.ts";
import { parseBody, sendJson } from "./httpUtils.ts";
import { PLAN_ENTITLEMENTS, normalizePlan } from "../../src/config/planEntitlements.ts";

function clampHsk(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(6, Math.max(1, Math.round(n)));
}

export async function handleGeneratePersonalizedLesson(req: any, res: any) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;

  const body = parseBody(req);
  const supabase = getSupabaseServerClient();
  const ai = getAI();

  if (!supabase) return sendJson(res, 503, { error: "Supabase is not configured." });
  if (!ai) return sendJson(res, 503, { error: "GEMINI_API_KEY is not configured on the server." });

  const [{ data: profile, error: profileError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabase.from("profiles").select("hsk_level, learning_goal, daily_minutes, native_language").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).maybeSingle(),
    ]);

  if (profileError) return sendJson(res, 500, { error: profileError.message });
  if (subscriptionError) return sendJson(res, 500, { error: subscriptionError.message });

  const plan = normalizePlan(
    subscription?.status === "active" || subscription?.status === "trialing" ? subscription?.plan : "free"
  );
  const entitlement = PLAN_ENTITLEMENTS[plan];
  const requestedLevel = clampHsk(body?.hskLevel ?? profile?.hsk_level ?? 1);

  if (requestedLevel > entitlement.maxHskLevel) {
    return sendJson(res, 403, {
      error: "This HSK level requires PRO.",
      code: "PLAN_UPGRADE_REQUIRED",
      maxHskLevel: entitlement.maxHskLevel,
    });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count: generatedToday, error: countError } = await supabase
    .from("user_personalized_lessons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString());

  if (countError) return sendJson(res, 500, { error: countError.message });

  const dailyLimit = plan === "premium" ? 10 : 1;
  if ((generatedToday || 0) >= dailyLimit) {
    return sendJson(res, 429, {
      error: `Daily personalized lesson limit reached for the ${plan} plan.`,
      code: "DAILY_LESSON_LIMIT",
      dailyLimit,
    });
  }

  const { data: cards, error: cardsError } = await supabase
    .from("user_vocabulary")
    .select("id, hanzi, pinyin, meaning, hsk_level, status, review_count, example_sentence")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(plan === "premium" ? 20 : 10);

  if (cardsError) return sendJson(res, 500, { error: cardsError.message });

  const relevantCards = (cards || []).filter((card: any) => Number(card.hsk_level || requestedLevel) <= requestedLevel);
  const vocabularyContext = relevantCards
    .map((card: any) => `${card.hanzi} | ${card.pinyin} | ${card.meaning} | status=${card.status}`)
    .join("\n");

  const topic = typeof body?.topic === "string" && body.topic.trim()
    ? body.topic.trim().slice(0, 80)
    : profile?.learning_goal || "daily conversation";

  const language = profile?.native_language === "en" ? "English" : "Vietnamese";

  const systemPrompt = `You are the personalized curriculum designer for HanziAI.
Create one practical Mandarin lesson for an authenticated learner.
HSK level: HSK ${requestedLevel}.
Learning goal: ${profile?.learning_goal || "conversation"}.
Topic: ${topic}.
UI language: ${language}.

Use the learner's saved vocabulary when it naturally fits. Do not force words into the lesson.
Return strict JSON:
{
  "title": "Vietnamese lesson title",
  "titleZh": "Chinese title",
  "objectives": ["3 short objectives"],
  "vocabulary": [
    {"hanzi":"", "pinyin":"","meaning":"","example":""}
  ],
  "grammar": [
    {"point":"","pattern":"","explanation":"","example":""}
  ],
  "dialogue": [
    {"speaker":"Lina","chinese":"","pinyin":"","translation":""},
    {"speaker":"Learner","chinese":"","pinyin":"","translation":""}
  ],
  "practice": [
    {"type":"translation|fill_blank|speaking","prompt":"","answer":""}
  ],
  "reviewWords": ["Hanzi words to reinforce"]
}`;

  const response = await generateContentSafely(ai, {
    contents: `Learner's saved vocabulary:\n${vocabularyContext || "No saved vocabulary yet."}\n\nGenerate a useful ${topic} lesson now.`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
  });

  let content: any;
  try {
    content = JSON.parse(response.text || "{}");
  } catch {
    const match = (response.text || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse personalized lesson JSON.");
    content = JSON.parse(match[0]);
  }

  const title = typeof content.title === "string" && content.title.trim()
    ? content.title.trim()
    : `Bài học cá nhân HSK ${requestedLevel}`;

  const { data: saved, error: saveError } = await supabase
    .from("user_personalized_lessons")
    .insert({
      user_id: user.id,
      hsk_level: requestedLevel,
      title,
      topic,
      content,
      source_vocabulary: relevantCards.map((card: any) => ({
        id: card.id,
        hanzi: card.hanzi,
        hskLevel: card.hsk_level,
      })),
    })
    .select()
    .single();

  if (saveError) return sendJson(res, 500, { error: saveError.message });

  return sendJson(res, 201, {
    lesson: saved,
    plan,
    hskLevel: requestedLevel,
    remainingToday: Math.max(0, dailyLimit - ((generatedToday || 0) + 1)),
  });
}
