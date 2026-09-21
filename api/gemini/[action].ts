import {
  handleConversation,
  handleSpeakingAnalyze,
  handleCorrect,
  handleSpeakingFeedback,
  handleTranslate,
  handleDictionaryLookup,
  handleLesson,
  handleQuiz,
  sendJson,
} from "../_lib/geminiHandlers";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  const action = req.query?.action;

  switch (action) {
    case "conversation":
      return handleConversation(req, res);
    case "speaking-analyze":
      return handleSpeakingAnalyze(req, res);
    case "correct":
      return handleCorrect(req, res);
    case "speaking-feedback":
      return handleSpeakingFeedback(req, res);
    case "translate":
      return handleTranslate(req, res);
    case "dictionary":
      return handleDictionaryLookup(req, res);
    case "lesson":
      return handleLesson(req, res);
    case "quiz":
      return handleQuiz(req, res);
    default:
      return sendJson(res, 404, { error: `Endpoint /api/gemini/${action} not found` });
  }
}
