// Pronunciation assessment contracts.
// Keep acoustic pronunciation separate from transcript/language feedback.

export type PronunciationAssessmentSource = 'acoustic' | 'unavailable';

export interface PronunciationAssessment {
  source: PronunciationAssessmentSource;
  accuracyScore: number | null;
  feedback: string;
  suggestedImprovement: string | null;
}

/**
 * Safe default until an acoustic speech assessment provider is wired in.
 * Never invents a pronunciation score from transcript text alone.
 */
export function createUnavailablePronunciationAssessment(
  language: string = 'vi'
): PronunciationAssessment {
  return {
    source: 'unavailable',
    accuracyScore: null,
    feedback: language === 'vi'
      ? 'Chưa có dữ liệu âm thanh để đánh giá phát âm.'
      : 'No audio data is available for pronunciation assessment yet.',
    suggestedImprovement: language === 'vi'
      ? 'Hãy ghi âm câu nói để hệ thống có thể đánh giá âm thanh khi tính năng này được kết nối.'
      : 'Record the spoken sentence so acoustic assessment can be added when the provider is connected.',
  };
}
