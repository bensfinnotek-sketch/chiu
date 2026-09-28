// Web Speech Recognition Service for HanziAI
// Target language: zh-CN (Mandarin)

import { pronunciationAudioTransport } from '../ai/pronunciation/audioTransport';

export interface SpeechRecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onInterimResult?: (interim: string) => void;
  onError?: (error: string) => void;
  onEnd?: (finalTranscript?: string, audioBlob?: Blob | null) => void;
  onStart?: () => void;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningActive: boolean = false;
  private isSupportedBrowser: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition;

      if (SpeechRecognition) {
        this.isSupportedBrowser = true;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public isSupported(): boolean {
    return this.isSupportedBrowser;
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public startListening(callbacks: SpeechRecognitionCallbacks): boolean {
    if (!this.recognition || !this.isSupportedBrowser) {
      if (callbacks.onError) {
        callbacks.onError('Trình duyệt hiện tại không hỗ trợ nhận diện giọng nói (Web Speech API). Bạn có thể gõ trực tiếp câu trả lời!');
      }
      return false;
    }

    try {
      this.abortListening();
    } catch {
      // ignore
    }

    let finalAccumulated = '';
    void pronunciationAudioTransport.start();

    this.recognition.onstart = () => {
      this.isListeningActive = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalAccumulated += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (interim && callbacks.onInterimResult) {
        callbacks.onInterimResult(interim);
      }

      const activeText = finalAccumulated || interim;
      callbacks.onResult(activeText, Boolean(finalAccumulated));
    };

    this.recognition.onerror = (event: any) => {
      this.isListeningActive = false;
      const errorCode = event?.error || 'unknown';

      let userMsg = 'Không thể nhận diện giọng nói.';
      if (errorCode === 'not-allowed') {
        userMsg = 'Quyền truy cập micro đã bị từ chối. Vui lòng cấp quyền micro trong cài đặt trình duyệt để luyện nói.';
      } else if (errorCode === 'no-speech') {
        userMsg = 'Không phát hiện thấy âm thanh. Hãy thử nói lại gần micro hơn nhé.';
      } else if (errorCode === 'audio-capture') {
        userMsg = 'Không tìm thấy micro phù hợp trên thiết bị của bạn.';
      } else if (errorCode === 'network') {
        userMsg = 'Mạng yếu hoặc không thể kết nối tới dịch vụ nhận diện giọng nói.';
      }

      if (callbacks.onError) callbacks.onError(userMsg);
    };

    this.recognition.onend = async () => {
      this.isListeningActive = false;
      const audioInput = await pronunciationAudioTransport.stop();
      if (callbacks.onEnd) callbacks.onEnd(finalAccumulated, audioInput?.blob || null);
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      pronunciationAudioTransport.cancel();
      if (callbacks.onError) {
        callbacks.onError(err?.message || 'Không thể khởi động micro.');
      }
      return false;
    }
  }

  public getLastAudioCapture(): Blob | null {
    return null;
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListeningActive = false;
  }

  public abortListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }
    this.isListeningActive = false;
    pronunciationAudioTransport.cancel();
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
