// Provider boundary for pronunciation assessment.
import type {
  PronunciationAssessment,
  PronunciationAudioInput,
} from './pronunciationTypes';
import { geminiService } from '../../services/geminiService';

export interface PronunciationProvider {
  assess(params: {
    spokenText: string;
    targetText?: string;
    language?: string;
    audio?: PronunciationAudioInput | null;
    signal?: AbortSignal;
  }): Promise<PronunciationAssessment>;
}

export class GeminiPronunciationProvider implements PronunciationProvider {
  public async assess(params: {
    spokenText: string;
    targetText?: string;
    language?: string;
    audio?: PronunciationAudioInput | null;
    signal?: AbortSignal;
  }): Promise<PronunciationAssessment> {
    if (!geminiService.assessPronunciation) {
      throw new Error('Pronunciation assessment is not available.');
    }

    return geminiService.assessPronunciation(params);
  }
}
