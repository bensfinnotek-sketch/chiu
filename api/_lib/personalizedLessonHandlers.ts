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

  if (!entitlement.personalizedCurriculum) {
    return sendJson(res, 403, {
      error: "Personalized curriculum is not available on this plan.",
      code: "PERSONALIZED_CURRICULUM_REQUIRED",
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

  const adaptive = body?.adaptiveProfile && typeof body.adaptiveProfile === "object" ? body.adaptiveProfile : {};
  const difficulty = ["nhẹ", "vừa", "thách thức"].includes(adaptive.difficulty) ? adaptive.difficulty : "vừa";
  const newWordsTarget = Math.min(12, Math.max(6, Number(adaptive.newWordsTarget) || 9));
  const quizIntensity = ["nhẹ", "chuẩn", "tập trung"].includes(adaptive.quizIntensity) ? adaptive.quizIntensity : "chuẩn";
  const speakingPace = ["chậm", "tự nhiên", "tăng phản xạ"].includes(adaptive.speakingPace) ? adaptive.speakingPace : "tự nhiên";
  const adaptiveFocus = typeof adaptive.focus === "string" ? adaptive.focus.slice(0, 80) : "Cân bằng 4 kỹ năng";
  const composerContext = body?.composerContext && typeof body.composerContext === "object" ? body.composerContext : {};
  const diagnosticTargets = Array.isArray(composerContext.diagnosticTargets)
    ? composerContext.diagnosticTargets
        .filter((item: any) => item && typeof item.id === "string")
        .slice(0, 5)
        .map((item: any) => ({
          kind: item.kind === "grammar" ? "grammar" : "vocabulary",
          id: item.id.slice(0, 80),
          accuracy: Number.isFinite(Number(item.accuracy)) ? Math.max(0, Math.min(100, Number(item.accuracy))) : null,
          errorPattern: typeof item.errorPattern === "string" ? item.errorPattern.slice(0, 30) : null,
        }))
    : [];
  const diagnosticLessonId = typeof composerContext.diagnosticLessonId === "string"
    ? composerContext.diagnosticLessonId.slice(0, 80)
    : null;
  const diagnosticFocus = typeof composerContext.diagnosticFocus === "string"
    ? composerContext.diagnosticFocus.slice(0, 30)
    : null;

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

Adaptive learner profile:
- Difficulty: ${difficulty}
- New vocabulary target: ${newWordsTarget} words
- Quiz intensity: ${quizIntensity}
- Speaking pace: ${speakingPace}
- Current focus: ${adaptiveFocus}

Diagnostic composer context:
- Diagnostic focus: ${diagnosticFocus || "none"}
- Target lesson id: ${diagnosticLessonId || "none"}
- Weak targets: ${diagnosticTargets.length ? JSON.stringify(diagnosticTargets) : "none"}

If diagnostic weak targets are provided, compose the lesson around those targets first. Reuse the target vocabulary or grammar in examples, dialogue, and practice so the lesson can directly test the diagnosed weakness. Do not invent IDs or mention internal IDs in learner-facing text. If no target matches the requested HSK level naturally, keep the lesson coherent rather than forcing it.
Use the learner's saved vocabulary when it naturally fits. Do not force words into the lesson.
Match the adaptive profile in the actual lesson content, not just in labels.
Return exactly ${newWordsTarget} vocabulary items when enough relevant vocabulary exists; otherwise return as many high-quality items as available.
For difficulty "nhẹ", use shorter sentences and fewer distractors. For "thách thức", use richer context and more nuanced examples.
For quiz intensity "nhẹ", provide 2 practice items; "chuẩn" provide 3; "tập trung" provide 5.
For speaking pace "chậm", keep speaking prompts short; for "tăng phản xạ", use rapid-response prompts with natural follow-ups.
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
