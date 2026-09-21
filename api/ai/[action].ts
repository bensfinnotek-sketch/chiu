import { handleSpeakingAnalyze, handleSummarize, sendJson } from "../_lib/geminiHandlers.ts";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  const action = req.query?.action;

  if (action === "speaking") {
    return handleSpeakingAnalyze(req, res);
  }

  if (action === "summarize") {
    return handleSummarize(req, res);
  }

  return sendJson(res, 404, { error: `Endpoint /api/ai/${action} not found` });
}
