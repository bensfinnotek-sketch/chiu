import { speechRecognitionService, type SpeechRecognitionCallbacks } from './speechRecognitionService';
import { textToSpeechService, type SpeakOptions } from './textToSpeechService';

export type SpeechLanguage = 'zh-CN' | 'zh-TW' | 'en-US' | 'vi-VN';

export interface SpeechService {
  isRecognitionSupported(): boolean;
  isTtsSupported(): boolean;
  startListening(callbacks: SpeechRecognitionCallbacks, language?: SpeechLanguage): boolean;
  stopListening(): void;
  abortListening(): void;
  isListening(): boolean;
  speakChinese(text: string, options?: SpeakOptions): void;
  stopSpeaking(): void;
  pauseSpeaking(): void;
  resumeSpeaking(): void;
  setVoice(voiceName?: string): void;
  getChineseVoices(): SpeechSynthesisVoice[];
}

export interface PronunciationAnalysis {
  available: boolean;
  overall?: number;
  tones?: number;
  initials?: number;
  finals?: number;
  fluency?: number;
  feedback: string;
}

export interface PronunciationAnalyzer {
  analyzePronunciation(targetText: string, recognizedText: string, audioData?: Blob | ArrayBuffer): Promise<PronunciationAnalysis>;
}

export const speechService: SpeechService = {
  isRecognitionSupported: () => speechRecognitionService.isSupported(),
  isTtsSupported: () => textToSpeechService.isSupported(),
  startListening: (callbacks, language = 'zh-CN') => speechRecognitionService.startListening(callbacks, language),
  stopListening: () => speechRecognitionService.stopListening(),
  abortListening: () => speechRecognitionService.abortListening(),
  isListening: () => speechRecognitionService.isListening(),
  speakChinese: (text, options) => textToSpeechService.speakChinese(text, options),
  stopSpeaking: () => textToSpeechService.stopSpeaking(),
  pauseSpeaking: () => textToSpeechService.pauseSpeaking(),
  resumeSpeaking: () => textToSpeechService.resumeSpeaking(),
  setVoice: (voiceName) => textToSpeechService.setVoice(voiceName),
  getChineseVoices: () => textToSpeechService.getChineseVoices(),
};

export const pronunciationAnalyzer: PronunciationAnalyzer = {
  async analyzePronunciation(targetText, recognizedText) {
    if (!speechService.isRecognitionSupported()) {
      return { available: false, feedback: 'Phân tích phát âm chi tiết chưa khả dụng trên trình duyệt này.' };
    }
    const target = targetText.trim();
    const recognized = recognizedText.trim();
    if (!target || !recognized) {
      return { available: false, feedback: 'Chưa đủ dữ liệu để phân tích phát âm.' };
    }
    const exact = target === recognized;
    return {
      available: false,
      feedback: exact
        ? 'Nhận diện câu khớp với câu mẫu. Đây là kiểm tra văn bản, chưa phải chấm điểm âm học thanh điệu.'
        : 'Đã nhận diện câu nói nhưng chưa thể chấm chính xác thanh điệu, âm đầu/cuối từ dữ liệu hiện có.',
    };
  },
};
