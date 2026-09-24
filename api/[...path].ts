import {
  handleHealth,
  handleConversation,
  handleSpeakingAnalyze,
  handleSummarize,
  handleCorrect,
  handleSpeakingFeedback,
  handleTranslate,
  handleDictionaryLookup,
  handleLesson,
  handleQuiz,
  sendJson,
} from "./_lib/geminiHandlers.ts";
import { handleGetLearningPlan } from "./_lib/learningPlanHandlers.ts";
import { handleGeneratePersonalizedLesson } from "./_lib/personalizedLessonHandlers.ts";
import {
  handleGetFlashcards,
  handleCreateFlashcard,
  handleUpdateFlashcard,
  handleDeleteFlashcard,
  handleGetUserProfile,
  handleReviewFlashcard,
} from "./_lib/flashcardHandlers.ts";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  // Extract path from req.query.path or req.url
  let segments: string[] = [];
  if (req.query?.path) {
    segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  } else {
    const rawUrl = (req.url || "").split("?")[0];
    const cleanUrl = rawUrl.replace(/^\/api\/?/, "");
    segments = cleanUrl.split("/").filter(Boolean);
  }

  const fullSubPath = segments.join("/");

  if (fullSubPath === "health") {
    return handleHealth(req, res);
  }
  if (fullSubPath === "ai/speaking" || fullSubPath === "gemini/speaking-analyze") {
    return handleSpeakingAnalyze(req, res);
  }
  if (fullSubPath === "ai/summarize") {
    return handleSummarize(req, res);
  }
  if (fullSubPath === "gemini/conversation") {
    return handleConversation(req, res);
  }
  if (fullSubPath === "gemini/correct") {
    return handleCorrect(req, res);
  }
  if (fullSubPath === "gemini/speaking-feedback") {
    return handleSpeakingFeedback(req, res);
  }
  if (fullSubPath === "gemini/translate") {
    return handleTranslate(req, res);
  }
  if (fullSubPath === "gemini/dictionary") {
    return handleDictionaryLookup(req, res);
  }
  if (fullSubPath === "gemini/lesson") {
    return handleLesson(req, res);
  }
  if (fullSubPath === "gemini/quiz") {
    return handleQuiz(req, res);
  }

  // Personalized learning endpoints (Protected)
  if (fullSubPath === "learning/plan" && req.method === "GET") {
    return handleGetLearningPlan(req, res);
  }
  if (fullSubPath === "learning/personalized-lesson" && req.method === "POST") {
    return handleGeneratePersonalizedLesson(req, res);
  }

  // Flashcards CRUD endpoints (Protected)
  if (fullSubPath === "flashcards") {
    if (req.method === "GET") return handleGetFlashcards(req, res);
    if (req.method === "POST") return handleCreateFlashcard(req, res);
    if (req.method === "PATCH" || req.method === "PUT") return handleUpdateFlashcard(req, res);
    if (req.method === "DELETE") return handleDeleteFlashcard(req, res);
  }
  if (fullSubPath.startsWith("flashcards/")) {
    const cardId = segments[1];
    if (segments[2] === "review" && req.method === "POST") return handleReviewFlashcard(req, res, cardId);
    if (req.method === "PATCH" || req.method === "PUT") return handleUpdateFlashcard(req, res, cardId);
    if (req.method === "DELETE") return handleDeleteFlashcard(req, res, cardId);
  }

  // User Profile endpoint (Protected)
  if (fullSubPath === "user/profile") {
    if (req.method === "GET") return handleGetUserProfile(req, res);
  }

  return sendJson(res, 404, { error: `API route /api/${fullSubPath} not found` });
}
