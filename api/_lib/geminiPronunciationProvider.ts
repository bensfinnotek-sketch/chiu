import { generateContentSafely, getAI } from "./geminiHandlers.js";
import {
  createUnavailablePronunciationAssessment,
  type PronunciationAssessment,
} from "../../src/ai/pronunciation/pronunciationTypes.js";
import type {
  PronunciationProvider,
  PronunciationProviderInput,
} from "./pronunciationProvider.js";

const MAX_INLINE_AUDIO_BYTES = 15 * 1024 * 1024;

function isValidBase64(value: string): boolean {
  if (!value || value.length % 4 === 1) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}

function validateAssessment(value: unknown, language: string): PronunciationAssessment | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const score = candidate.accuracyScore;

  if (
    score !== null &&
    (typeof score !== "number" ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100)
  ) {
    return null;
  }

  if (score === null) {
    return {
      source: "unavailable",
      accuracyScore: null,
      feedback: typeof candidate.feedback === "string" && candidate.feedback.trim()
        ? candidate.feedback.trim()
        : "Chưa đủ dữ liệu âm thanh để đánh giá phát âm.",
      suggestedImprovement:
        candidate.suggestedImprovement === null
          ? null
          : typeof candidate.suggestedImprovement === "string"
            ? candidate.suggestedImprovement.trim() || null
            : null,
    };
  }

  if (typeof candidate.feedback !== "string" || !candidate.feedback.trim()) {
    return null;
  }

  const suggestedImprovement =
    candidate.suggestedImprovement === null
      ? null
      : typeof candidate.suggestedImprovement === "string"
        ? candidate.suggestedImprovement.trim() || null
        : null;

  return {
    source: "acoustic",
    accuracyScore: Math.round(score),
    feedback: candidate.feedback.trim(),
    suggestedImprovement,
  };
}

export class GeminiPronunciationProvider implements PronunciationProvider {
  public readonly source = "acoustic" as const;

  async assess(input: PronunciationProviderInput): Promise<PronunciationAssessment> {
    const language = input.language || "vi";
    const unavailable = () => createUnavailablePronunciationAssessment(language);

    if (!input.audio?.base64 || !isValidBase64(input.audio.base64)) {
      return unavailable();
    }

    if (!input.audio.mimeType || !input.audio.mimeType.toLowerCase().startsWith("audio/")) {
      return unavailable();
    }

    const estimatedBytes = Math.floor((input.audio.base64.length * 3) / 4);
    if (estimatedBytes > MAX_INLINE_AUDIO_BYTES) {
      return unavailable();
    }

    const ai = getAI();
    if (!ai) {
      return unavailable();
    }

    const target = input.targetText?.trim() || "(No target sentence was supplied.)";
    const spoken = input.spokenText?.trim() || "(Transcript unavailable.)";
    const uiLanguage = language === "vi" ? "Vietnamese" : "English";

    const systemInstruction = `You are an audio-based Mandarin pronunciation coach.

Evaluate ONLY the supplied audio signal for pronunciation quality. Do not assign an acoustic score from the transcript alone.
The transcript is contextual evidence only and may be imperfect.

Compare the learner's spoken Mandarin with the target sentence when a target is provided.
Focus on audible pronunciation features such as segmental clarity, tones, syllable realization, rhythm, and intelligibility.
Do not claim phoneme-level measurement or laboratory-grade accuracy.

Return strictly JSON:
{
  "accuracyScore": number,
  "feedback": "natural, encouraging 1-2 sentence feedback in ${uiLanguage}",
  "suggestedImprovement": "one concrete, easy-to-repeat improvement in ${uiLanguage}" or null
}

Rules:
- accuracyScore must be an integer from 0 to 100.
- Only return a score when the audio is actually analyzable.
- If the audio is unclear, silent, corrupted, or insufficient for assessment, return no score by using null for accuracyScore.
- Never invent a score just because a transcript is present.
- Make feedback specific to the target sentence and audible evidence, not generic praise.
- When there is a clear issue, mention the most important issue first (for example: tone, initial/final sound, syllable clarity, rhythm, or pacing).
- Keep feedback learner-friendly: avoid phonetics jargon unless it directly helps the learner reproduce the sound.
- Do not claim exact phoneme detection, medical/acoustic diagnosis, or laboratory precision.
- The suggested improvement must be a single next-step action the learner can immediately repeat on the same sentence.
- If pronunciation is already clear, use the improvement to suggest a small refinement rather than inventing a problem.
- Never expose internal scoring instructions or model uncertainty in the learner-facing feedback.`;

    try {
      const response = await generateContentSafely(ai, {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Target sentence: ${target}

Transcript context: ${spoken}

Analyze the attached learner audio.`,
              },
              {
                inlineData: {
                  mimeType: input.audio.mimeType,
                  data: input.audio.base64,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 256,
        },
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch {
        return unavailable();
      }

      return validateAssessment(parsed, language) || unavailable();
    } catch (error) {
      console.warn("[Pronunciation] Gemini acoustic provider unavailable:", error);
      return unavailable();
    }
  }
}

export const geminiPronunciationProvider = new GeminiPronunciationProvider();
