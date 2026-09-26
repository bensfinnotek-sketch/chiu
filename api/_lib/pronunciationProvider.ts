import type {
  PronunciationAssessment,
  PronunciationAssessmentSource,
} from "../../src/ai/pronunciation/pronunciationTypes.js";

export interface PronunciationProviderAudio {
  base64: string;
  mimeType: string;
}

export interface PronunciationProviderInput {
  spokenText: string;
  targetText?: string;
  language?: string;
  audio: PronunciationProviderAudio;
}

export interface PronunciationProvider {
  source: PronunciationAssessmentSource;
  assess(input: PronunciationProviderInput): Promise<PronunciationAssessment>;
}
