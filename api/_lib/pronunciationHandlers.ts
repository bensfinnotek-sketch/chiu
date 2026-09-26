import { parseBody, sendJson } from "./httpUtils.ts";
import { geminiPronunciationProvider } from "./geminiPronunciationProvider.ts";
import { createUnavailablePronunciationAssessment } from "../../src/ai/pronunciation/pronunciationTypes.ts";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function isValidBase64(value: string): boolean {
  return Boolean(value) && value.length % 4 !== 1 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}

export async function handlePronunciation(req: any, res: any) {
  try {
    const body = parseBody(req);
    const language = typeof body?.language === "string" ? body.language : "vi";
    const spokenText = typeof body?.spokenText === "string" ? body.spokenText.trim() : "";
    const targetText = typeof body?.targetText === "string" ? body.targetText.trim() : undefined;
    const audio = body?.audio;

    if (!audio || typeof audio.base64 !== "string" || typeof audio.mimeType !== "string") {
      return sendJson(res, 400, {
        ...createUnavailablePronunciationAssessment(language),
        error: "Audio input is required for pronunciation assessment.",
      });
    }

    const estimatedBytes = Math.floor((audio.base64.length * 3) / 4);
    if (
      estimatedBytes <= 0 ||
      estimatedBytes > MAX_AUDIO_BYTES ||
      !isValidBase64(audio.base64) ||
      !audio.mimeType.toLowerCase().startsWith("audio/")
    ) {
      return sendJson(res, 413, {
        ...createUnavailablePronunciationAssessment(language),
        error: "Audio input is invalid or too large.",
      });
    }

    const assessment = await geminiPronunciationProvider.assess({
      spokenText,
      targetText,
      language,
      audio: {
        base64: audio.base64,
        mimeType: audio.mimeType,
      },
    });

    return sendJson(res, 200, assessment);
  } catch (error: any) {
    console.error("[Pronunciation] API error:", error?.message || error);
    return sendJson(res, 200, createUnavailablePronunciationAssessment("vi"));
  }
}
