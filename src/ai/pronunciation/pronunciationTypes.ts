// Pronunciation assessment contracts.
// Keep acoustic pronunciation separate from transcript/language feedback.

export type PronunciationAssessmentSource = 'acoustic' | 'unavailable';

export interface PronunciationAudioInput {
  blob: Blob;
  mimeType: string;
}

export interface PronunciationAssessment {
  source: PronunciationAssessmentSource;
  accuracyScore: number | null;
  feedback: string;
  suggestedImprovement: string | null;
}

/**
 * Safe state whenever acoustic assessment is unavailable or cannot produce
 * a trustworthy score. Never invents a pronunciation score from transcript text alone.
 */
export function createUnavailablePronunciationAssessment(
  language: string = 'vi'
): PronunciationAssessment {
  return {
    source: 'unavailable',
    accuracyScore: null,
    feedback: language === 'vi'
      ? 'Chưa thể đánh giá phát âm bằng dữ liệu âm thanh ở lượt nói này.'
      : 'Acoustic pronunciation assessment is unavailable for this turn.',
    suggestedImprovement: language === 'vi'
      ? 'Hãy thử ghi âm lại câu nói để tiếp tục kiểm tra phát âm.'
      : 'Try recording the sentence again to continue pronunciation assessment.',
  };
}
