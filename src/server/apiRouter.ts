import { Router, Request, Response } from "express";
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
  getAI,
  generateContentSafely,
} from "../../api/_lib/geminiHandlers.ts";
import {
  handleGetFlashcards,
  handleCreateFlashcard,
  handleUpdateFlashcard,
  handleDeleteFlashcard,
  handleGetUserProfile,
} from "../../api/_lib/flashcardHandlers.ts";

export {
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
  handleGetFlashcards,
  handleCreateFlashcard,
  handleUpdateFlashcard,
  handleDeleteFlashcard,
  handleGetUserProfile,
  getAI,
  generateContentSafely,
};

export function createApiRouter(): Router {
  const router = Router();

  // CORS and Cache Control middleware for Express API routes
  router.use((_req: Request, res: Response, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    if (_req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Health check endpoint
  router.get("/health", handleHealth);

  // AI Conversation with Teacher Lina
  router.post("/gemini/conversation", handleConversation);

  // Handler for AI Speaking Analysis & Conversation (turn-by-turn)
  router.post("/gemini/speaking-analyze", handleSpeakingAnalyze);
  router.post("/ai/speaking", handleSpeakingAnalyze);

  // Memory Summarization Endpoint
  router.post("/ai/summarize", handleSummarize);

  // AI Sentence Correction
  router.post("/gemini/correct", handleCorrect);

  // AI Speaking Feedback
  router.post("/gemini/speaking-feedback", handleSpeakingFeedback);

  // AI Translator with nuances and formal/casual variations
  router.post("/gemini/translate", handleTranslate);

  // AI Dictionary lookup (handles both GET and POST)
  router.get("/gemini/dictionary", handleDictionaryLookup);
  router.post("/gemini/dictionary", handleDictionaryLookup);

  // AI Lesson Generator
  router.post("/gemini/lesson", handleLesson);

  // AI Quiz Generator
  router.post("/gemini/quiz", handleQuiz);

  // Flashcards CRUD endpoints (Protected)
  router.get("/flashcards", handleGetFlashcards);
  router.post("/flashcards", handleCreateFlashcard);
  router.patch("/flashcards/:id", (req, res) => handleUpdateFlashcard(req, res, req.params.id));
  router.put("/flashcards/:id", (req, res) => handleUpdateFlashcard(req, res, req.params.id));
  router.delete("/flashcards/:id", (req, res) => handleDeleteFlashcard(req, res, req.params.id));
  router.delete("/flashcards", (req, res) => handleDeleteFlashcard(req, res));

  // User Profile endpoint (Protected)
  router.get("/user/profile", handleGetUserProfile);

  return router;
}
