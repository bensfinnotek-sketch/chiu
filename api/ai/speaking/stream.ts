import { handleSpeakingAnalyze, sendJson } from "../../_lib/geminiHandlers.ts";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const chunks: string[] = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const originalStatus = res.status?.bind(res);
  let statusCode = 200;

  try {
    res.write = (chunk: any) => {
      chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return true;
    };
    res.end = (chunk?: any) => {
      if (chunk) chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return res;
    };
    if (originalStatus) {
      res.status = (code: number) => {
        statusCode = code;
        return originalStatus(code);
      };
    }

    await handleSpeakingAnalyze(req, res);

    const bodyText = chunks.join("");
    let data: any = null;
    try { data = JSON.parse(bodyText); } catch {}

    res.write = originalWrite;
    res.end = originalEnd;
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (!data || statusCode >= 400) {
      originalWrite(`data: ${JSON.stringify({ type: "error", error: data?.error || "Speaking analysis failed." })}\\n\\n`);
      return originalEnd();
    }

    const reply = String(data.reply || data.chinese || "");
    if (reply) originalWrite(`data: ${JSON.stringify({ type: "delta", text: reply })}\\n\\n`);
    originalWrite(`data: ${JSON.stringify({ type: "structured", data })}\\n\\n`);
    originalWrite(`data: ${JSON.stringify({ type: "done", model: "speaking-analyze" })}\\n\\n`);
    return originalEnd();
  } catch (error: any) {
    res.write = originalWrite;
    res.end = originalEnd;
    if (!res.headersSent) return sendJson(res, 500, { error: error?.message || "Speaking stream failed." });
    originalWrite(`data: ${JSON.stringify({ type: "error", error: "Speaking stream failed." })}\\n\\n`);
    return originalEnd();
  }
}
